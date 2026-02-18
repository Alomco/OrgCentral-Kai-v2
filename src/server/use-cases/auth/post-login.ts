import type { createAuth } from '@/server/lib/auth';
import { requireSessionAuthorization } from '@/server/security/authorization';
import {
    getMembershipRoleSnapshot,
    resolveRoleDashboard,
    resolveRoleRedirectPath,
    ROLE_DASHBOARD_PATHS,
    sanitizeNextPath,
} from '@/server/ui/auth/role-redirect';
import { getAuthOrganizationBridgeService } from '@/server/services/auth/auth-organization-bridge-service.provider';
import type { IPostLoginMembershipRepository } from '@/server/repositories/contracts/auth/sessions/post-login-membership-repository-contract';
import { resolveWorkspaceSetupState } from '@/server/use-cases/auth/sessions/workspace-setup-state';
import {
    hasInactiveMembership,
    listMembershipsForUser,
    resolveMembershipRepository,
    selectLatestActiveMembershipOrgId,
    type MembershipLookupRecord,
} from './post-login.membership';

const DEFAULT_NEXT_PATH = '/dashboard';
const LOGIN_PATH = '/login';
const NOT_INVITED_PATH = '/not-invited';
const ACCESS_DENIED_PATH = '/access-denied';
const MFA_SETUP_PATH = '/two-factor/setup';
const PROFILE_SETUP_PATH = '/hr/profile';

interface SafeNextPath {
    path: string;
    isExplicit: boolean;
}

type PostLoginMembershipRepositoryContract = Pick<
    IPostLoginMembershipRepository,
    'listMembershipsForUser'
>;

export interface PostLoginDependencies {
    auth: ReturnType<typeof createAuth>;
}

export interface PostLoginOverrides {
    auth: PostLoginDependencies['auth'];
    membershipRepository?: PostLoginMembershipRepositoryContract;
}

export interface PostLoginInput {
    headers: Headers;
    requestUrl: URL;
}
export interface PostLoginResult {
    redirectUrl: URL;
    setActiveHeaders?: Headers;
}

export async function handlePostLogin(
    overrides: PostLoginOverrides,
    input: PostLoginInput,
): Promise<PostLoginResult> {
    const membershipRepository = resolveMembershipRepository(overrides.membershipRepository);
    const session = await overrides.auth.api.getSession({ headers: input.headers });
    const { path: nextPath, isExplicit } = resolveSafeNextPath(input.requestUrl);

    if (!session?.session) {
        return { redirectUrl: buildLoginRedirect(input.requestUrl, nextPath) };
    }

    const desiredOrgSlug = resolveOptionalOrgSlug(input.requestUrl);
    const currentActiveOrgId = session.session.activeOrganizationId;

    let desiredOrgId: string | null = null;
    let scopedMemberships: MembershipLookupRecord[] | null = null;
    let allMemberships: MembershipLookupRecord[] | null = null;

    if (desiredOrgSlug) {
        scopedMemberships = await listMembershipsForUser(
            membershipRepository,
            session.user.id,
            desiredOrgSlug,
        );
        desiredOrgId = selectLatestActiveMembershipOrgId(scopedMemberships);
    }

    desiredOrgId ??= currentActiveOrgId ?? null;

    if (desiredOrgId === null) {
        if (isInvitationAcceptancePath(nextPath)) {
            return { redirectUrl: new URL(nextPath, input.requestUrl.origin) };
        }
        allMemberships = await listMembershipsForUser(membershipRepository, session.user.id);
        desiredOrgId = selectLatestActiveMembershipOrgId(allMemberships);
    }

    if (desiredOrgId === null) {
        const membershipsForStatus = scopedMemberships ?? allMemberships ?? [];
        if (hasInactiveMembership(membershipsForStatus)) {
            return { redirectUrl: buildMembershipInactiveRedirect(input.requestUrl, nextPath) };
        }
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
    const workspaceSetup = await resolveWorkspaceSetupState({
        authUserId: session.user.id,
        orgId: desiredOrgId,
        userId: session.user.id,
        roleKey: dashboardRole,
    });

    if (workspaceSetup.requiresPasswordSetup) {
        return { redirectUrl: buildSetupRedirect(input.requestUrl, MFA_SETUP_PATH, nextPath) };
    }

    if (workspaceSetup.requiresProfileSetup) {
        return { redirectUrl: buildSetupRedirect(input.requestUrl, PROFILE_SETUP_PATH, nextPath) };
    }

    const redirectPath = isExplicit
        ? resolveRoleRedirectPath(dashboardRole, nextPath)
        : ROLE_DASHBOARD_PATHS[dashboardRole];

    if (currentActiveOrgId === desiredOrgId) {
        return { redirectUrl: new URL(redirectPath, input.requestUrl.origin) };
    }

    await ensureAuthOrganizationBridge(desiredOrgId, session.user.id, membershipSnapshot.roleName);

    const { headers: setActiveHeaders } = await overrides.auth.api.setActiveOrganization({
        headers: input.headers,
        body: { organizationId: desiredOrgId },
        returnHeaders: true,
    });

    return {
        redirectUrl: new URL(redirectPath, input.requestUrl.origin),
        setActiveHeaders,
    };
}

function isInvitationAcceptancePath(nextPath: string): boolean {
    try {
        const pathname = new URL(nextPath, 'http://localhost').pathname;
        return pathname === '/accept-invitation';
    } catch {
        return nextPath.startsWith('/accept-invitation');
    }
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
    if (typeof candidate !== 'string') { return null; }
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function ensureAuthOrganizationBridge(
    orgId: string,
    userId: string,
    roleNameOverride: string | null,
): Promise<void> {
    const authBridgeService = getAuthOrganizationBridgeService();
    await authBridgeService.ensureAuthOrganizationBridge(orgId, userId, roleNameOverride);
}

function buildLoginRedirect(requestUrl: URL, nextPath: string): URL {
    return new URL(`${LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`, requestUrl.origin);
}

function buildNotInvitedRedirect(requestUrl: URL, nextPath: string): URL {
    return new URL(`${NOT_INVITED_PATH}?next=${encodeURIComponent(nextPath)}`, requestUrl.origin);
}

function buildMembershipInactiveRedirect(requestUrl: URL, nextPath: string): URL {
    const redirectUrl = new URL(ACCESS_DENIED_PATH, requestUrl.origin);
    redirectUrl.searchParams.set('reason', 'membership_inactive');
    redirectUrl.searchParams.set('next', nextPath);
    return redirectUrl;
}

function buildSetupRedirect(requestUrl: URL, path: string, nextPath: string): URL {
    const redirectUrl = new URL(path, requestUrl.origin);
    redirectUrl.searchParams.set('next', nextPath);
    return redirectUrl;
}
