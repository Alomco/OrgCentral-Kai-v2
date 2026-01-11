import { NextResponse, type NextRequest } from 'next/server';

import type { AbacPolicy } from '@/server/security/abac-types';
import { getTenantAbacPolicies } from '@/server/security/abac';
import { createAuth } from '@/server/lib/auth';
import { isOrgRoleKey } from '@/server/security/access-control';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { listSessionOrganizations, type DebugOrgSummary } from '@/server/use-cases/auth/debug-security';

// Note: Removed 'export const dynamic = "force-dynamic"' as it's incompatible with nextConfig.cacheComponents
// This route should use dynamic rendering by default since it accesses request data

type DebugSecurityResponse =
    | {
        ok: true;
        authenticated: false;
    }
    | {
        ok: true;
        authenticated: true;
        session: {
            user: {
                id: string;
                email: string | null;
                name: string | null;
            };
            session: {
                activeOrganizationId: string | null;
                expiresAt?: string;
                createdAt?: string;
            };
        };
        organizations?: DebugOrgSummary[];
        authorization?: {
            orgId: string;
            userId: string;
            roleKey: string;
            dataResidency: string;
            dataClassification: string;
            auditSource: string;
            correlationId: string;
        };
        rbac?: {
            roleStatements?: Record<string, string[]>;
        };
        abac?: {
            policyCount: number;
            policies: AbacPolicy[];
            usingFallbackPolicies: boolean;
        };
        warning?: string;
    };

function noStoreJson<TBody>(body: TBody, init?: { status?: number }): NextResponse<TBody> {
    return NextResponse.json(body, {
        status: init?.status,
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}

function toNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function safeIsoString(value: unknown): string | undefined {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        return value;
    }
    return undefined;
}

export async function GET(request: NextRequest): Promise<Response> {
    if (process.env.NODE_ENV !== 'development') {
        return noStoreJson({ ok: false, error: { code: 'NOT_FOUND', message: 'Not found.' } }, { status: 404 });
    }

    const auth = createAuth(request.nextUrl.origin);
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.session) {
        return noStoreJson<DebugSecurityResponse>({ ok: true, authenticated: false });
    }

    const activeOrganizationId = toNullableString(session.session.activeOrganizationId);
    const safeSession = {
        user: {
            id: session.user.id,
            email: toNullableString(session.user.email),
            name: toNullableString(session.user.name),
        },
        session: {
            activeOrganizationId,
            expiresAt: safeIsoString((session.session as { expiresAt?: unknown }).expiresAt),
            createdAt: safeIsoString((session.session as { createdAt?: unknown }).createdAt),
        },
    };

    if (!activeOrganizationId) {
        const organizations = await listSessionOrganizations(session.user.id);
        return noStoreJson<DebugSecurityResponse>({
            ok: true,
            authenticated: true,
            session: safeSession,
            organizations,
            warning: 'No active organization is set on the session yet. Set one via bootstrap or org switcher.',
        });
    }

    try {
        const { authorization } = await getSessionContext({}, {
            headers: request.headers,
            auditSource: 'api:debug:security',
        });

        const policies = await getTenantAbacPolicies(authorization.orgId);
        const usingFallbackPolicies = policies.some((policy) => policy.id.startsWith('default:abac:'));

        const roleStatements =
            typeof authorization.roleKey === 'string' && isOrgRoleKey(authorization.roleKey)
                ? (authorization.permissions as Record<string, string[]>)
                : undefined;

        return noStoreJson<DebugSecurityResponse>({
            ok: true,
            authenticated: true,
            session: safeSession,
            authorization: {
                orgId: authorization.orgId,
                userId: authorization.userId,
                roleKey: authorization.roleKey,
                dataResidency: authorization.dataResidency,
                dataClassification: authorization.dataClassification,
                auditSource: authorization.auditSource,
                correlationId: authorization.correlationId,
            },
            rbac: roleStatements ? { roleStatements } : undefined,
            abac: {
                policyCount: policies.length,
                policies,
                usingFallbackPolicies,
            },
        });
    } catch (error) {
        const organizations = await listSessionOrganizations(session.user.id).catch(() => []);
        const message = error instanceof Error ? error.message : 'Failed to resolve authorization context.';

        return noStoreJson<DebugSecurityResponse>({
            ok: true,
            authenticated: true,
            session: safeSession,
            organizations: organizations.length ? organizations : undefined,
            warning: message,
        });
    }
}
