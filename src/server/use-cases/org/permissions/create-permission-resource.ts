import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { PermissionResource } from '@/server/types/security-types';
import { CACHE_SCOPE_PERMISSIONS } from '@/server/repositories/cache-scopes';
import { invalidateOrgCache } from '@/server/lib/cache-tags';

export interface CreatePermissionResourceDependencies {
    permissionRepository: IPermissionResourceRepository;
}

export interface CreatePermissionResourceInput {
    authorization: RepositoryAuthorizationContext;
    resource: string;
    actions: string[];
    description?: string | null;
    metadata?: PermissionResource['metadata'];
}

export async function createPermissionResource(
    deps: CreatePermissionResourceDependencies,
    input: CreatePermissionResourceInput,
): Promise<PermissionResource> {
    const resource = input.resource.trim();
    if (!resource) {
        throw new ValidationError('Resource name is required.');
    }
    if (!Array.isArray(input.actions) || input.actions.length === 0) {
        throw new ValidationError('At least one action is required.');
    }
    const actions = normalizeActions(input.actions);
    if (actions.length === 0) {
        throw new ValidationError('At least one valid action is required.');
    }

    const existing = await deps.permissionRepository.getResourceByName(input.authorization.orgId, resource);
    if (existing) {
        throw new ValidationError('A permission resource with this name already exists.');
    }

    await deps.permissionRepository.createResource(input.authorization.orgId, {
        orgId: input.authorization.orgId,
        resource,
        actions,
        description: input.description ?? null,
        metadata: input.metadata,
    });

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_PERMISSIONS,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    const created = await deps.permissionRepository.getResourceByName(input.authorization.orgId, resource);
    if (!created) {
        throw new EntityNotFoundError('PermissionResource', { resource });
    }
    return created;
}

function normalizeActions(actions: string[]): string[] {
    return Array.from(
        new Set(
            actions
                .map((action) => action.trim())
                .filter((action) => action.length > 0),
        ),
    );
}
