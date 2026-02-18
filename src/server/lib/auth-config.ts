import { randomUUID } from 'node:crypto';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { mcp, organization, username, twoFactor } from 'better-auth/plugins';

import { prisma } from '@/server/lib/prisma';
import { orgAccessControl, orgRoles } from '@/server/security/better-auth-access';

import {
    createAuthDatabaseHooks,
    getAuthSyncQueueClientOrNull,
    type AuthSyncQueueClient,
} from '@/server/lib/auth-sync-hooks';
import { isAuthSyncEnabled } from '@/server/lib/auth-environment';

export interface AuthConfigDependencies {
    authSyncQueueFactory?: () => AuthSyncQueueClient;
}

export function createAuth(baseURL: string, deps: AuthConfigDependencies = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
    const microsoftTenantId = process.env.MICROSOFT_TENANT_ID;

    if (isProduction && microsoftClientId && !microsoftTenantId) {
        throw new Error('MICROSOFT_TENANT_ID must be set in production when MICROSOFT_CLIENT_ID is configured.');
    }

    const authSyncQueue = deps.authSyncQueueFactory
        ? getAuthSyncQueueClientOrNull(isAuthSyncEnabled(), deps.authSyncQueueFactory)
        : null;

    return betterAuth({
        baseURL,
        advanced: {
            database: {
                generateId: () => randomUUID(),
            },
        },
        database: prismaAdapter(prisma, { provider: 'postgresql' }),
        user: {
            modelName: 'authUser',
        },
        session: {
            modelName: 'authSession',
        },
        account: {
            modelName: 'authAccount',
            encryptOAuthTokens: true,
        },
        verification: {
            modelName: 'verification',
        },
        emailAndPassword: {
            enabled: true,
            disableSignUp: true,
        },
        socialProviders: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID ?? '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
                enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
                disableSignUp: true,
            },
            microsoft: {
                clientId: microsoftClientId ?? '',
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
                tenantId: microsoftTenantId ?? 'common',
                enabled: Boolean(microsoftClientId),
                disableSignUp: true,
            },
        },
        plugins: [
            organization({
                ac: orgAccessControl,
                roles: orgRoles,
                enforceUniqueSlug: true,
                allowUserToCreateOrganization: (user) => user.email.endsWith('.gov.uk'),
                schema: {
                    organization: {
                        modelName: 'authOrganization',
                    },
                    member: {
                        modelName: 'authOrgMember',
                    },
                    invitation: {
                        modelName: 'authOrgInvitation',
                    },
                    session: {
                        fields: {
                            activeOrganizationId: 'activeOrganizationId',
                        },
                    },
                },
            }),
            username(),
            twoFactor({
                issuer: 'OrgCentral',
                skipVerificationOnEnable: false,
            }),
            mcp({
                loginPage: `${baseURL}/login`,
                resource: 'orgcentral-api',
                oidcConfig: {
                    metadata: {
                        issuer: baseURL,
                    },
                    loginPage: `${baseURL}/login`,
                },
            }),
            nextCookies(),
        ],
        security: {
            token: {
                accessTokenExpiresIn: '15m',
                refreshTokenExpiresIn: '7d',
            },
        },
        databaseHooks: createAuthDatabaseHooks(authSyncQueue),
    });
}
