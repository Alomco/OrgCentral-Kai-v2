import type { PermissionResource } from '@/server/types/security-types';

export function extractLegacyKeys(resource: PermissionResource): string[] {
    const metadata = resource.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return [];
    }

    const legacyKeys = (metadata as { legacyKeys?: unknown }).legacyKeys;
    if (!Array.isArray(legacyKeys)) {
        return [];
    }

    return legacyKeys.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}
