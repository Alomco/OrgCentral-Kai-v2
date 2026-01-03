import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IPermissionResourceRepository } from '@/server/repositories/contracts/org/permissions/permission-resource-repository-contract';
import type { PermissionResource } from '@/server/types/security-types';
import { CACHE_SCOPE_PERMISSIONS } from '@/server/repositories/cache-scopes';
import { invalidateOrgCache } from '@/server/lib/cache-tags';

export interface UpdatePermissionResourceDependencies {
    permissionRepository: IPermissionResourceRepository;
}

export interface UpdatePermissionResourceInput {
    authorization: RepositoryAuthorizationContext;
    resourceId: string;
    resource?: string;
    actions?: string[];
    description?: string | null;
    metadata?: PermissionResource['metadata'];
}

export async function updatePermissionResource(
    deps: UpdatePermissionResourceDependencies,
    input: UpdatePermissionResourceInput,
): Promise<PermissionResource> {
    const existing = await deps.permissionRepository.getResource(input.authorization.orgId, input.resourceId);
    if (!existing) {
        throw new EntityNotFoundError('PermissionResource', { resourceId: input.resourceId });
    }

    const updates: Partial<Omit<PermissionResource, 'id' | 'orgId' | 'createdAt'>> = {};

    if (typeof input.resource === 'string') {
        const nextResource = input.resource.trim();
        if (!nextResource) {
            throw new ValidationError('Resource name cannot be empty.');
        }
        if (nextResource !== existing.resource) {
            const duplicate = await deps.permissionRepository.getResourceByName(input.authorization.orgId, nextResource);
            if (duplicate && duplicate.id !== existing.id) {
                throw new ValidationError('A permission resource with this name already exists.');
            }
        }
        updates.resource = nextResource;
    }

    if (input.actions !== undefined) {
        if (!Array.isArray(input.actions) || input.actions.length === 0) {
            throw new ValidationError('At least one action is required.');
        }
        const actions = normalizeActions(input.actions);
        if (actions.length === 0) {
            throw new ValidationError('At least one valid action is required.');
        }
        updates.actions = actions;
    }

    if (input.description !== undefined) {
        updates.description = input.description;
    }

    if (input.metadata !== undefined) {
        updates.metadata = input.metadata;
    }

    if (Object.keys(updates).length === 0) {
        throw new ValidationError('No updates were provided.');
    }

    await deps.permissionRepository.updateResource(input.authorization.orgId, input.resourceId, updates);

    await invalidateOrgCache(
        input.authorization.orgId,
        CACHE_SCOPE_PERMISSIONS,
        input.authorization.dataClassification,
        input.authorization.dataResidency,
    );

    const updated = await deps.permissionRepository.getResource(input.authorization.orgId, input.resourceId);
    if (!updated) {
        throw new EntityNotFoundError('PermissionResource', { resourceId: input.resourceId });
    }
    return updated;
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
