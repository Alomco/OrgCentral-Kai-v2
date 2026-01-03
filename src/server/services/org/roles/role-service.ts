import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';
import type { Role } from '@/server/types/hr-types';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { getPermissionResolutionService } from '@/server/services/security/permission-resolution-service.provider';
import { CACHE_SCOPE_PERMISSIONS } from '@/server/repositories/cache-scopes';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import {
  createRole as createRoleUseCase,
  type CreateRoleInput,
} from '@/server/use-cases/org/roles/create-role';
import {
  updateRole as updateRoleUseCase,
  type UpdateRoleInput,
} from '@/server/use-cases/org/roles/update-role';
import {
  deleteRole as deleteRoleUseCase,
  type DeleteRoleInput,
} from '@/server/use-cases/org/roles/delete-role';
import {
  listRoles as listRolesUseCase,
  type ListRolesInput,
} from '@/server/use-cases/org/roles/list-roles';
import { getRole as getRoleUseCase, type GetRoleInput } from '@/server/use-cases/org/roles/get-role';
import type { NotificationComposerContract } from '@/server/services/platform/notifications/notification-composer.provider';

type RoleChangeKind = 'created' | 'updated' | 'deleted';

const ROLE_RESOURCE_TYPE = 'org.role';
const ROLE_ADMIN_PERMISSIONS: Record<string, string[]> = { organization: ['update'] };

export interface RoleServiceDependencies {
  roleRepository: IRoleRepository;
  notificationComposer?: NotificationComposerContract;
}

export class RoleService extends AbstractOrgService {
  constructor(private readonly dependencies: RoleServiceDependencies) {
    super();
  }

  async listRoles(input: ListRolesInput): Promise<Role[]> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      action: 'org.role.list',
      resourceType: ROLE_RESOURCE_TYPE,
    });
    const context = this.buildContext(input.authorization);
    return this.executeInServiceContext(context, 'roles.list', () =>
      listRolesUseCase({ roleRepository: this.dependencies.roleRepository }, input),
    );
  }

  async getRole(input: GetRoleInput): Promise<Role> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      action: 'org.role.get',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleId: input.roleId },
    });
    const context = this.buildContext(input.authorization, { metadata: { roleId: input.roleId } });
    return this.executeInServiceContext(context, 'roles.get', () =>
      getRoleUseCase({ roleRepository: this.dependencies.roleRepository }, input),
    );
  }

  async createRole(input: CreateRoleInput): Promise<Role> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      action: 'org.role.create',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleName: input.name },
    });
    const context = this.buildContext(input.authorization, { metadata: { roleName: input.name } });

    const role = await this.executeInServiceContext(context, 'roles.create', () =>
      createRoleUseCase({ roleRepository: this.dependencies.roleRepository }, input),
    );

    await this.invalidatePermissionCaches(input.authorization);
    await this.auditRoleChange(input.authorization, role, 'created');
    await this.notify(input.authorization, role, 'created');
    return role;
  }

  async updateRole(input: UpdateRoleInput): Promise<Role> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      action: 'org.role.update',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: {
        roleId: input.roleId,
        updateKeys: Object.keys(input).filter((key) => key !== 'authorization'),
      },
    });
    const context = this.buildContext(input.authorization, { metadata: { roleId: input.roleId } });

    const role = await this.executeInServiceContext(context, 'roles.update', () =>
      updateRoleUseCase({ roleRepository: this.dependencies.roleRepository }, input),
    );

    await this.invalidatePermissionCaches(input.authorization);
    await this.auditRoleChange(input.authorization, role, 'updated');
    await this.notify(input.authorization, role, 'updated');
    return role;
  }

  async deleteRole(input: DeleteRoleInput): Promise<void> {
    await this.ensureOrgAccess(input.authorization, {
      requiredPermissions: ROLE_ADMIN_PERMISSIONS,
      action: 'org.role.delete',
      resourceType: ROLE_RESOURCE_TYPE,
      resourceAttributes: { roleId: input.roleId },
    });
    const context = this.buildContext(input.authorization, { metadata: { roleId: input.roleId } });

    const result = await this.executeInServiceContext(context, 'roles.delete', () =>
      deleteRoleUseCase({ roleRepository: this.dependencies.roleRepository }, input),
    );

    await this.invalidatePermissionCaches(input.authorization);
    await this.auditRoleChange(input.authorization, result.role, 'deleted');
    await this.notify(input.authorization, {
      ...result.role,
      description: result.role.description ?? null,
      permissions: result.role.permissions,
      createdAt: result.role.createdAt,
      updatedAt: result.role.updatedAt,
    }, 'deleted');
  }

  private async auditRoleChange(
    authorization: RepositoryAuthorizationContext,
    role: Role,
    kind: RoleChangeKind,
  ): Promise<void> {
    await recordAuditEvent({
      orgId: authorization.orgId,
      userId: authorization.userId,
      eventType: 'POLICY_CHANGE',
      action: `role.${kind}`,
      resource: ROLE_RESOURCE_TYPE,
      resourceId: role.id,
      payload: {
        name: role.name,
        scope: role.scope,
        permissions: role.permissions,
        inheritsRoleIds: role.inheritsRoleIds ?? [],
        isSystem: role.isSystem ?? false,
        isDefault: role.isDefault ?? false,
      },
      correlationId: authorization.correlationId,
      residencyZone: authorization.dataResidency,
      classification: authorization.dataClassification,
      auditSource: authorization.auditSource,
      auditBatchId: authorization.auditBatchId,
    });
  }

  private async invalidatePermissionCaches(authorization: RepositoryAuthorizationContext): Promise<void> {
    getPermissionResolutionService().invalidateOrgPermissions(authorization.orgId);
    await invalidateOrgCache(
      authorization.orgId,
      CACHE_SCOPE_PERMISSIONS,
      authorization.dataClassification,
      authorization.dataResidency,
    );
  }

  private async notify(
    authorization: RepositoryAuthorizationContext,
    role: Role,
    kind: RoleChangeKind,
  ): Promise<void> {
    const composer = this.dependencies.notificationComposer;
    if (!composer) {
      return;
    }

    const title = `Role ${kind}`;
    const body = `Role "${role.name}" was ${kind}.`;

    await composer.composeAndSend({
      authorization,
      notification: {
        userId: authorization.userId,
        title,
        body,
        topic: 'system-announcement',
        priority: 'medium',
      },
      abac: {
        action: 'notification.compose',
        resourceType: 'notification',
        resourceAttributes: { targetUserId: authorization.userId },
      },
    });
  }
}
