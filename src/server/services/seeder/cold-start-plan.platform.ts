import { buildRoleServiceDependencies } from '@/server/repositories/providers/org/role-service-dependencies';
import { buildPermissionResourceServiceDependencies } from '@/server/repositories/providers/org/permission-resource-service-dependencies';
import { buildComplianceRepositoryDependencies } from '@/server/repositories/providers/hr/compliance-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PERMISSIONS, CACHE_SCOPE_ROLES } from '@/server/repositories/cache-scopes';
import { TENANT_ROLE_KEYS } from '@/server/security/role-constants';
import { ROLE_TEMPLATES } from '@/server/security/role-templates';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';
import { seedDefaultComplianceTemplates } from '@/server/use-cases/hr/compliance/seed-default-templates';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { Role } from '@/server/types/hr-types';

export async function seedTenantRoles(
    authorization: RepositoryAuthorizationContext,
): Promise<{ success: boolean; message: string; count?: number }> {
    const { roleRepository } = buildRoleServiceDependencies();
    const existing = await roleRepository.getRolesByOrganization(authorization.orgId);
    const byName = new Map(existing.map((role) => [role.name, role]));
    let created = 0;

    for (const roleKey of TENANT_ROLE_KEYS) {
        const template = ROLE_TEMPLATES[roleKey];
        if (byName.has(template.name)) {
            continue;
        }
        await roleRepository.createRole(authorization.orgId, {
            orgId: authorization.orgId,
            name: template.name,
            description: template.description,
            scope: template.scope,
            permissions: template.permissions as Role['permissions'],
            inheritsRoleIds: [],
            isSystem: template.isSystem ?? false,
            isDefault: template.isDefault ?? false,
        });
        created++;
    }

    const refreshed = await roleRepository.getRolesByOrganization(authorization.orgId);
    const refreshedByName = new Map(refreshed.map((role) => [role.name, role]));
    for (const roleKey of TENANT_ROLE_KEYS) {
        const template = ROLE_TEMPLATES[roleKey];
        const role = refreshedByName.get(template.name);
        if (!role || !template.inherits?.length) {
            continue;
        }
        const inheritedRoleIds = template.inherits
            .map((name) => refreshedByName.get(name)?.id)
            .filter((id): id is string => typeof id === 'string');
        await roleRepository.updateRole(authorization.orgId, role.id, { inheritsRoleIds: inheritedRoleIds });
    }

    await invalidateOrgCache(
        authorization.orgId,
        CACHE_SCOPE_ROLES,
        authorization.dataClassification,
        authorization.dataResidency,
    );

    return { success: true, message: 'Seeded tenant roles', count: created };
}

export async function seedPermissions(
    authorization: RepositoryAuthorizationContext,
): Promise<{ success: boolean; message: string; count?: number }> {
    const { permissionRepository } = buildPermissionResourceServiceDependencies();
    await seedPermissionResources({ permissionResourceRepository: permissionRepository }, { orgId: authorization.orgId });
    const resources = await permissionRepository.listResources(authorization.orgId);
    await invalidateOrgCache(
        authorization.orgId,
        CACHE_SCOPE_PERMISSIONS,
        authorization.dataClassification,
        authorization.dataResidency,
    );
    return { success: true, message: 'Seeded permission resources', count: resources.length };
}

export async function seedComplianceTemplates(
    authorization: RepositoryAuthorizationContext,
    force: boolean,
): Promise<{ success: boolean; message: string }> {
    const { complianceTemplateRepository, complianceCategoryRepository } = buildComplianceRepositoryDependencies();
    const result = await seedDefaultComplianceTemplates(
        { complianceTemplateRepository, complianceCategoryRepository },
        { authorization, force },
    );
    const status = result.created ? 'created' : 'skipped';
    return { success: true, message: `Compliance template ${status}` };
}
