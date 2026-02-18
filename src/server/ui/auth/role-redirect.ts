import { RoleScope } from '@/server/types/prisma';
import { createMembershipRoleSnapshotRepository } from '@/server/repositories/providers/auth/membership-role-snapshot-repository-provider';

/**
 * Dashboard role determines which admin layout a user sees.
 * - globalAdmin: GLOBAL scope roles (covers both global and dev admins)
 * - employee: ORG or DELEGATED scope roles
 */
export type RoleDashboardKey = 'globalAdmin' | 'employee';

export const ROLE_DASHBOARD_PATHS: Record<RoleDashboardKey, string> = {
    globalAdmin: '/admin/dashboard',
    employee: '/dashboard',
} as const;

export interface MembershipRoleSnapshot {
    roleName: string;
    roleScope: RoleScope;
    orgSlug: string;
}

export async function getMembershipRoleSnapshot(
    orgId: string,
    userId: string,
): Promise<MembershipRoleSnapshot | null> {
    const membership = await membershipRoleSnapshotRepository.getMembershipRoleSnapshot(orgId, userId);
    if (!membership) {
        return null;
    }

    return {
        roleName: membership.roleName,
        roleScope: membership.roleScope,
        orgSlug: membership.orgSlug,
    };
}

/**
 * Resolves the dashboard role based on role scope only.
 * GLOBAL scope → globalAdmin (full admin access)
 * ORG/DELEGATED scope → employee (standard workspace)
 */
export function resolveRoleDashboard(snapshot: MembershipRoleSnapshot): RoleDashboardKey {
    if (snapshot.roleScope === RoleScope.GLOBAL) {
        return 'globalAdmin';
    }
    return 'employee';
}

export function resolveRoleRedirectPath(role: RoleDashboardKey, nextPath: string): string {
    if (isRoleNextPathAllowed(role, nextPath)) {
        return nextPath;
    }
    return ROLE_DASHBOARD_PATHS[role];
}

export function sanitizeNextPath(candidate: string | null | undefined): string | null {
    if (!candidate) {
        return null;
    }

    if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('://')) {
        return null;
    }

    return candidate;
}

export function isRoleNextPathAllowed(role: RoleDashboardKey, nextPath: string): boolean {
    const normalizedPath = normalizePathname(nextPath);

    if (role === 'globalAdmin') {
        // Global admins can access all paths
        return true;
    }
    // Employees cannot access /admin or /dev paths
    return !isPathSegment(normalizedPath, '/admin') && !isPathSegment(normalizedPath, '/dev');
}

function isPathSegment(pathname: string, segment: string): boolean {
    return pathname === segment || pathname.startsWith(`${segment}/`);
}

function normalizePathname(nextPath: string): string {
    try {
        return new URL(nextPath, 'http://localhost').pathname;
    } catch {
        return nextPath;
    }
}

const membershipRoleSnapshotRepository = createMembershipRoleSnapshotRepository();
