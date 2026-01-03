import type { OrgPermissionMap } from '@/server/security/access-control';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { GuardMembershipRecord } from '@/server/repositories/contracts/security/guard-membership-repository-contract';

export interface PermissionResolutionServiceDependencies {
    roleRepository: IRoleRepository;
}

export interface PermissionResolutionOptions {
    cacheTtlMs?: number;
}

interface CachedPermissions {
    value: OrgPermissionMap;
    expiresAt: number;
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

export class PermissionResolutionService {
    private readonly cache = new Map<string, CachedPermissions>();
    private readonly cacheTtlMs: number;

    constructor(
        private readonly dependencies: PermissionResolutionServiceDependencies,
        options: PermissionResolutionOptions = {},
    ) {
        this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    }

    async resolveMembershipPermissions(member: GuardMembershipRecord): Promise<OrgPermissionMap> {
        if (!member.roleId) {
            return this.normalizePermissions(member.rolePermissions ?? {});
        }
        const resolved = await this.resolveRolePermissions(member.orgId, member.roleId);
        return Object.keys(resolved).length ? resolved : this.normalizePermissions(member.rolePermissions ?? {});
    }

    async resolveRolePermissions(orgId: string, roleId: string): Promise<OrgPermissionMap> {
        const cacheKey = `${orgId}:${roleId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }

        const permissions = await this.resolveRolePermissionsRecursive(orgId, roleId, new Set());
        this.cache.set(cacheKey, { value: permissions, expiresAt: Date.now() + this.cacheTtlMs });
        return permissions;
    }

    invalidateOrgPermissions(orgId: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${orgId}:`)) {
                this.cache.delete(key);
            }
        }
    }

    private async resolveRolePermissionsRecursive(
        orgId: string,
        roleId: string,
        visited: Set<string>,
    ): Promise<OrgPermissionMap> {
        if (visited.has(roleId)) {
            return {};
        }
        visited.add(roleId);

        const role = await this.dependencies.roleRepository.getRole(orgId, roleId);
        if (!role) {
            return {};
        }

        const permissions = this.normalizePermissions(role.permissions);
        const inherits = Array.isArray(role.inheritsRoleIds) ? role.inheritsRoleIds : [];

        for (const inheritedRoleId of inherits) {
            if (typeof inheritedRoleId !== 'string' || inheritedRoleId.length === 0) {
                continue;
            }
            const inheritedPermissions = await this.resolveRolePermissionsRecursive(orgId, inheritedRoleId, visited);
            this.mergePermissions(permissions, inheritedPermissions);
        }

        return permissions;
    }

    private normalizePermissions(input: unknown): OrgPermissionMap {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            return {};
        }
        const record = input as Record<string, unknown>;
        const normalized: OrgPermissionMap = {};
        for (const [resource, actions] of Object.entries(record)) {
            if (!Array.isArray(actions)) {
                continue;
            }
            const filtered = actions.filter(
                (action): action is string => typeof action === 'string' && action.length > 0,
            );
            if (filtered.length > 0) {
                normalized[resource] = filtered;
            }
        }
        return normalized;
    }

    private mergePermissions(target: OrgPermissionMap, source: OrgPermissionMap): void {
        for (const [resource, actions] of Object.entries(source)) {
            if (!actions?.length) {
                continue;
            }
            const current = new Set([...(target[resource] ?? []), ...actions]);
            target[resource] = Array.from(current);
        }
    }
}
