import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { PermissionResource } from '@/server/types/security-types';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import {
    createPermissionResource,
    type CreatePermissionResourceInput,
} from '@/server/use-cases/org/permissions/create-permission-resource';
import {
    updatePermissionResource,
    type UpdatePermissionResourceInput,
} from '@/server/use-cases/org/permissions/update-permission-resource';
import {
    deletePermissionResource,
    type DeletePermissionResourceInput,
} from '@/server/use-cases/org/permissions/delete-permission-resource';
import {
    listPermissionResources,
    type ListPermissionResourcesInput,
} from '@/server/use-cases/org/permissions/list-permission-resources';
import {
    getPermissionResource,
    type GetPermissionResourceInput,
} from '@/server/use-cases/org/permissions/get-permission-resource';

const PERMISSION_RESOURCE_TYPE = 'org.permissionResource';
const PERMISSION_ADMIN_REQUIRED: Record<string, string[]> = { organization: ['update'] };

export interface PermissionResourceServiceDependencies {
    permissionRepository: IPermissionResourceRepository;
}

type PermissionChangeKind = 'created' | 'updated' | 'deleted';

export class PermissionResourceService extends AbstractOrgService {
    constructor(private readonly dependencies: PermissionResourceServiceDependencies) {
        super();
    }

    async listResources(input: ListPermissionResourcesInput): Promise<PermissionResource[]> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: PERMISSION_ADMIN_REQUIRED,
            action: 'org.permissionResource.list',
            resourceType: PERMISSION_RESOURCE_TYPE,
        });
        const context = this.buildContext(input.authorization);
        return this.executeInServiceContext(context, 'permissions.list', () =>
            listPermissionResources({ permissionRepository: this.dependencies.permissionRepository }, input),
        );
    }

    async getResource(input: GetPermissionResourceInput): Promise<PermissionResource> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: PERMISSION_ADMIN_REQUIRED,
            action: 'org.permissionResource.get',
            resourceType: PERMISSION_RESOURCE_TYPE,
            resourceAttributes: { resourceId: input.resourceId },
        });
        const context = this.buildContext(input.authorization, { metadata: { resourceId: input.resourceId } });
        return this.executeInServiceContext(context, 'permissions.get', () =>
            getPermissionResource({ permissionRepository: this.dependencies.permissionRepository }, input),
        );
    }

    async createResource(input: CreatePermissionResourceInput): Promise<PermissionResource> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: PERMISSION_ADMIN_REQUIRED,
            action: 'org.permissionResource.create',
            resourceType: PERMISSION_RESOURCE_TYPE,
            resourceAttributes: { resource: input.resource },
        });
        const context = this.buildContext(input.authorization, { metadata: { resource: input.resource } });
        const resource = await this.executeInServiceContext(context, 'permissions.create', () =>
            createPermissionResource({ permissionRepository: this.dependencies.permissionRepository }, input),
        );
        await this.auditChange(input.authorization, resource, 'created');
        return resource;
    }

    async updateResource(input: UpdatePermissionResourceInput): Promise<PermissionResource> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: PERMISSION_ADMIN_REQUIRED,
            action: 'org.permissionResource.update',
            resourceType: PERMISSION_RESOURCE_TYPE,
            resourceAttributes: { resourceId: input.resourceId },
        });
        const context = this.buildContext(input.authorization, { metadata: { resourceId: input.resourceId } });
        const resource = await this.executeInServiceContext(context, 'permissions.update', () =>
            updatePermissionResource({ permissionRepository: this.dependencies.permissionRepository }, input),
        );
        await this.auditChange(input.authorization, resource, 'updated');
        return resource;
    }

    async deleteResource(input: DeletePermissionResourceInput): Promise<void> {
        await this.ensureOrgAccess(input.authorization, {
            requiredPermissions: PERMISSION_ADMIN_REQUIRED,
            action: 'org.permissionResource.delete',
            resourceType: PERMISSION_RESOURCE_TYPE,
            resourceAttributes: { resourceId: input.resourceId },
        });
        const context = this.buildContext(input.authorization, { metadata: { resourceId: input.resourceId } });
        const resource = await this.executeInServiceContext(context, 'permissions.delete', () =>
            deletePermissionResource({ permissionRepository: this.dependencies.permissionRepository }, input),
        );
        await this.auditChange(input.authorization, resource, 'deleted');
    }

    private async auditChange(
        authorization: RepositoryAuthorizationContext,
        resource: PermissionResource,
        kind: PermissionChangeKind,
    ): Promise<void> {
        await recordAuditEvent({
            orgId: authorization.orgId,
            userId: authorization.userId,
            eventType: 'POLICY_CHANGE',
            action: `permissionResource.${kind}`,
            resource: PERMISSION_RESOURCE_TYPE,
            resourceId: resource.id,
            payload: {
                resource: resource.resource,
                actions: resource.actions,
            },
            correlationId: authorization.correlationId,
            residencyZone: authorization.dataResidency,
            classification: authorization.dataClassification,
            auditSource: authorization.auditSource,
            auditBatchId: authorization.auditBatchId,
        });
    }
}
