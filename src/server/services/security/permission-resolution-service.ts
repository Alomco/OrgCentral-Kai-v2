import type { OrgPermissionMap } from '@/server/security/access-control';
import type { IRoleRepository } from '@/server/repositories/contracts/org/roles/role-repository-contract';
import type { GuardMembershipRecord } from '@/server/repositories/contracts/security/guard-membership-repository-contract';
import { AbstractBaseService } from '@/server/services/abstract-base-service';

export interface PermissionResolutionServiceDependencies {
    roleRepository: IRoleRepository;
}

export interface PermissionResolutionOptions {
    cacheTtlMs?: number;
    cacheMaxEntries?: number;
}

interface CachedPermissions {
    value: OrgPermissionMap;
    expiresAt: number;
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_CACHE_MAX_ENTRIES = 5_000;

export class PermissionResolutionService extends AbstractBaseService {
    private readonly cache = new Map<string, CachedPermissions>();
    private readonly cacheTtlMs: number;
    private readonly cacheMaxEntries: number;

    constructor(
        private readonly dependencies: PermissionResolutionServiceDependencies,
        options: PermissionResolutionOptions = {},
    ) {
        super();
        this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
        this.cacheMaxEntries = this.resolveCacheMaxEntries(options.cacheMaxEntries);
    }

    async resolveMembershipPermissions(member: GuardMembershipRecord): Promise<OrgPermissionMap> {
        if (!member.roleId) {
            return this.normalizePermissions(member.rolePermissions ?? {});
        }
        const resolved = await this.resolveRolePermissions(member.orgId, member.roleId);
        return Object.keys(resolved).length ? resolved : this.normalizePermissions(member.rolePermissions ?? {});
    }

    async resolveRolePermissions(orgId: string, roleId: string): Promise<OrgPermissionMap> {
        const now = Date.now();
        this.pruneExpiredCacheEntries(now);
        const cacheKey = `${orgId}:${roleId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.value;
        }
        if (cached) {
            this.cache.delete(cacheKey);
        }

        const permissions = await this.resolveRolePermissionsRecursive(orgId, roleId, new Set());
        this.setCacheEntry(cacheKey, permissions, now);
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

    private pruneExpiredCacheEntries(now: number): void {
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key);
            }
        }
    }

    private setCacheEntry(cacheKey: string, value: OrgPermissionMap, now: number): void {
        this.cache.delete(cacheKey);
        this.cache.set(cacheKey, {
            value,
            expiresAt: now + this.cacheTtlMs,
        });

        while (this.cache.size > this.cacheMaxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (!oldestKey) {
                break;
            }
            this.cache.delete(oldestKey);
        }
    }

    private resolveCacheMaxEntries(value?: number): number {
        if (!Number.isFinite(value) || typeof value !== 'number' || value <= 0) {
            return DEFAULT_CACHE_MAX_ENTRIES;
        }
        return Math.max(1, Math.floor(value));
    }
}
