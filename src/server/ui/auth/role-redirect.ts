import { type RoleScope } from '@prisma/client';

import { prisma } from '@/server/lib/prisma';

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
    const membership = await prisma.membership.findUnique({
        where: { orgId_userId: { orgId, userId } },
        select: {
            role: { select: { name: true, scope: true } },
            org: { select: { slug: true } },
        },
    });

    if (!membership) {
        return null;
    }

    return {
        roleName: membership.role.name,
        roleScope: membership.role.scope,
        orgSlug: membership.org.slug,
    };
}

/**
 * Resolves the dashboard role based on role scope only.
 * GLOBAL scope → globalAdmin (full admin access)
 * ORG/DELEGATED scope → employee (standard workspace)
 */
export function resolveRoleDashboard(snapshot: MembershipRoleSnapshot): RoleDashboardKey {
    if (snapshot.roleScope === 'GLOBAL') {
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
