import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { MembershipStatus } from '@prisma/client';
import type { createAuth } from '@/server/lib/auth';
import { prisma as defaultPrisma } from '@/server/lib/prisma';
import { requireSessionAuthorization } from '@/server/security/authorization';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    resolveRoleRedirectPath,
    ROLE_DASHBOARD_PATHS,
    sanitizeNextPath,
} from '@/server/ui/auth/role-redirect';

const DEFAULT_NEXT_PATH = '/dashboard';
const LOGIN_PATH = '/login';
const NOT_INVITED_PATH = '/not-invited';

interface SafeNextPath {
    path: string;
    isExplicit: boolean;
}

export interface PostLoginDependencies {
    prisma: PrismaClient;
    auth: ReturnType<typeof createAuth>;
}

export type PostLoginOverrides = {
    auth: PostLoginDependencies['auth'];
} & Partial<Omit<PostLoginDependencies, 'auth'>>;

export interface PostLoginInput {
    headers: Headers;
    requestUrl: URL;
}

export interface PostLoginResult {
    redirectUrl: URL;
    setActiveHeaders?: Headers;
}

export function buildPostLoginDependencies(overrides: PostLoginOverrides): PostLoginDependencies {
    return {
        prisma: overrides.prisma ?? defaultPrisma,
        auth: overrides.auth,
    };
}

export async function handlePostLogin(
    overrides: PostLoginOverrides,
    input: PostLoginInput,
): Promise<PostLoginResult> {
    const deps = buildPostLoginDependencies(overrides);
    const session = await deps.auth.api.getSession({ headers: input.headers });
    const { path: nextPath, isExplicit } = resolveSafeNextPath(input.requestUrl);

    if (!session?.session) {
        return { redirectUrl: buildLoginRedirect(input.requestUrl, nextPath) };
    }

    const desiredOrgSlug = resolveOptionalOrgSlug(input.requestUrl);
    const currentActiveOrgId = session.session.activeOrganizationId;

    let desiredOrgId: string | null = null;

    if (desiredOrgSlug) {
        desiredOrgId = await resolveOrganizationId(deps.prisma, session.user.id, desiredOrgSlug);
    }

    desiredOrgId ??= currentActiveOrgId ?? null;
    desiredOrgId ??= await resolveOrganizationId(deps.prisma, session.user.id, null);

    if (!desiredOrgId) {
        return { redirectUrl: buildNotInvitedRedirect(input.requestUrl, nextPath) };
    }

    const membershipSnapshot = await getMembershipRoleSnapshot(desiredOrgId, session.user.id);
    if (!membershipSnapshot) {
        return { redirectUrl: buildNotInvitedRedirect(input.requestUrl, nextPath) };
    }

    await requireSessionAuthorization(session, {
        orgId: desiredOrgId,
        auditSource: 'auth:post-login',
    });

    const dashboardRole = resolveRoleDashboard(membershipSnapshot);
    const redirectPath = isExplicit
        ? resolveRoleRedirectPath(dashboardRole, nextPath)
        : ROLE_DASHBOARD_PATHS[dashboardRole];

    if (currentActiveOrgId === desiredOrgId) {
        return { redirectUrl: new URL(redirectPath, input.requestUrl.origin) };
    }

    await ensureAuthOrganizationBridge(deps.prisma, desiredOrgId, session.user.id, membershipSnapshot.roleName);

    const { headers: setActiveHeaders } = await deps.auth.api.setActiveOrganization({
        headers: input.headers,
        body: { organizationId: desiredOrgId },
        returnHeaders: true,
    });

    return {
        redirectUrl: new URL(redirectPath, input.requestUrl.origin),
        setActiveHeaders,
    };
}

function resolveSafeNextPath(requestUrl: URL): SafeNextPath {
    const candidate = requestUrl.searchParams.get('next');
    if (typeof candidate === 'string') {
        const safeNextPath = sanitizeNextPath(candidate);
        if (safeNextPath) {
            return { path: safeNextPath, isExplicit: true };
        }
    }

    return { path: DEFAULT_NEXT_PATH, isExplicit: false };
}

function resolveOptionalOrgSlug(requestUrl: URL): string | null {
    const candidate = requestUrl.searchParams.get('org');
    if (typeof candidate !== 'string') {
        return null;
    }
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function resolveOrganizationId(
    prisma: PrismaClient,
    userId: string,
    orgSlug: string | null,
): Promise<string | null> {
    if (orgSlug) {
        const membership = await prisma.membership.findFirst({
            where: { userId, status: MembershipStatus.ACTIVE, org: { slug: orgSlug } },
            select: { orgId: true },
        });
        return membership?.orgId ?? null;
    }

    const membership = await prisma.membership.findFirst({
        where: { userId, status: MembershipStatus.ACTIVE },
        select: { orgId: true, activatedAt: true, invitedAt: true },
        orderBy: [
            { activatedAt: 'desc' },
            { invitedAt: 'desc' },
        ],
    });

    return membership?.orgId ?? null;
}

async function ensureAuthOrganizationBridge(
    prisma: PrismaClient,
    orgId: string,
    userId: string,
    roleNameOverride: string | null,
): Promise<void> {
    const organization = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, slug: true },
    });

    if (!organization) {
        return;
    }

    await prisma.authOrganization.upsert({
        where: { id: organization.id },
        update: { name: organization.name, slug: organization.slug },
        create: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            metadata: JSON.stringify({ seedSource: 'post-login' }),
        },
    });

    const roleName = roleNameOverride ?? 'member';

    const authMember = await prisma.authOrgMember.findFirst({
        where: { organizationId: organization.id, userId },
        select: { id: true },
    });

    if (authMember) {
        await prisma.authOrgMember.update({
            where: { id: authMember.id },
            data: { role: roleName },
        });
    } else {
        await prisma.authOrgMember.create({
            data: {
                id: randomUUID(),
                organizationId: organization.id,
                userId,
                role: roleName,
            },
        });
    }
}

function buildLoginRedirect(requestUrl: URL, nextPath: string): URL {
    return new URL(`${LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`, requestUrl.origin);
}

function buildNotInvitedRedirect(requestUrl: URL, nextPath: string): URL {
    return new URL(`${NOT_INVITED_PATH}?next=${encodeURIComponent(nextPath)}`, requestUrl.origin);
}
