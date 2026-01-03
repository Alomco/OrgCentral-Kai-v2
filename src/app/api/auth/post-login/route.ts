import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';

import { MembershipStatus } from '@prisma/client';
import { createAuth } from '@/server/lib/auth';
import { prisma } from '@/server/lib/prisma';
import { appendSetCookieHeaders } from '@/server/api-adapters/http/set-cookie-headers';
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

function resolveSafeNextPath(request: NextRequest): SafeNextPath {
    const candidate = request.nextUrl.searchParams.get('next');
    if (typeof candidate === 'string') {
        const safeNextPath = sanitizeNextPath(candidate);
        if (safeNextPath) {
            return { path: safeNextPath, isExplicit: true };
        }
    }

    return { path: DEFAULT_NEXT_PATH, isExplicit: false };
}

function resolveOptionalOrgSlug(request: NextRequest): string | null {
    const candidate = request.nextUrl.searchParams.get('org');
    if (typeof candidate !== 'string') {
        return null;
    }
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function resolveOrganizationId(userId: string, orgSlug: string | null): Promise<string | null> {
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

async function handlePostLogin(request: NextRequest): Promise<NextResponse> {
    const auth = createAuth(request.nextUrl.origin);
    const session = await auth.api.getSession({ headers: request.headers });
    const { path: nextPath, isExplicit } = resolveSafeNextPath(request);

    if (!session?.session) {
        return buildLoginRedirect(request, nextPath);
    }

    const desiredOrgSlug = resolveOptionalOrgSlug(request);
    const currentActiveOrgId = session.session.activeOrganizationId;

    let desiredOrgId: string | null = null;

    if (desiredOrgSlug) {
        desiredOrgId = await resolveOrganizationId(session.user.id, desiredOrgSlug);
    }

    desiredOrgId ??= currentActiveOrgId ?? null;
    desiredOrgId ??= await resolveOrganizationId(session.user.id, null);

    if (!desiredOrgId) {
        return buildNotInvitedRedirect(request, nextPath);
    }

    const membershipSnapshot = await getMembershipRoleSnapshot(desiredOrgId, session.user.id);
    if (!membershipSnapshot) {
        return buildNotInvitedRedirect(request, nextPath);
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
        return NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
    }

    await ensureAuthOrganizationBridge(
        desiredOrgId,
        session.user.id,
        membershipSnapshot.roleName,
    );

    const { headers: setActiveHeaders } = await auth.api.setActiveOrganization({
        headers: request.headers,
        body: { organizationId: desiredOrgId },
        returnHeaders: true,
    });

    const response = NextResponse.redirect(new URL(redirectPath, request.nextUrl.origin));
    appendSetCookieHeaders(setActiveHeaders, response.headers);
    return response;
}

function buildLoginRedirect(request: NextRequest, nextPath: string): NextResponse {
    const url = new URL(`${LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`, request.nextUrl.origin);
    return NextResponse.redirect(url);
}

function buildNotInvitedRedirect(request: NextRequest, nextPath: string): NextResponse {
    const url = new URL(`${NOT_INVITED_PATH}?next=${encodeURIComponent(nextPath)}`, request.nextUrl.origin);
    return NextResponse.redirect(url);
}

async function ensureAuthOrganizationBridge(
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

export async function GET(request: NextRequest): Promise<Response> {
    return handlePostLogin(request);
}

export async function POST(request: NextRequest): Promise<Response> {
    return handlePostLogin(request);
}
