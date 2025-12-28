import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import {
    ComplianceTier,
    DataClassificationLevel,
    DataResidencyZone,
    MembershipStatus,
    OrganizationStatus,
    RoleScope,
} from '@prisma/client';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { AuthorizationError, ValidationError } from '@/server/errors';
import { createAuth } from '@/server/lib/auth';
import { syncBetterAuthUserToPrisma } from '@/server/lib/auth-sync';
import { prisma } from '@/server/lib/prisma';
import { orgRoles } from '@/server/security/access-control';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { appendSetCookieHeaders } from '@/server/api-adapters/http/set-cookie-headers';
import {
    BOOTSTRAP_SEED_SOURCE,
    assertUuid,
    constantTimeEquals,
    ensureAuthUserIdIsUuid,
    ensurePlatformAuthOrganization,
    isBootstrapEnabled,
    requireBootstrapSecret,
    resolvePlatformConfig,
} from './admin-bootstrap.helpers';

const requestSchema = z.object({
    token: z.string().min(1),
});


export async function POST(request: NextRequest): Promise<Response> {
    try {
        if (!isBootstrapEnabled()) {
            throw new AuthorizationError('Admin bootstrap is disabled.');
        }

        const payload = requestSchema.parse(await request.json());
        const expectedSecret = requireBootstrapSecret();
        if (!constantTimeEquals(payload.token, expectedSecret)) {
            throw new AuthorizationError('Invalid bootstrap secret.');
        }

        // Bootstrap is explicitly gated by env + secret; direct Prisma access is scoped to this one-time flow.
        const auth = createAuth(request.nextUrl.origin);
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.session) {
            throw new AuthorizationError('Unauthenticated request.');
        }

        const userEmail = session.user.email;
        const userName = session.user.name;
        const providerId = 'oauth';

        if (typeof userEmail !== 'string' || userEmail.trim().length === 0) {
            throw new ValidationError('Authenticated user is missing an email address.');
        }

        const normalizedEmail = userEmail.trim().toLowerCase();
        const userId = await ensureAuthUserIdIsUuid(session.user.id, normalizedEmail);
        assertUuid(userId, 'User id');

        await syncBetterAuthUserToPrisma({
            id: userId,
            email: normalizedEmail,
            name: typeof userName === 'string' ? userName : null,
            emailVerified: true,
            lastSignInAt: new Date(),
            updatedAt: new Date(),
        });

        const config = resolvePlatformConfig();
        const superAdminMetadata: Prisma.InputJsonObject = {
            seedSource: BOOTSTRAP_SEED_SOURCE,
            roles: [config.roleName],
            bootstrapProvider: providerId,
        };

        const organization = await prisma.organization.upsert({
            where: { slug: config.platformOrgSlug },
            update: {
                name: config.platformOrgName,
                regionCode: config.platformRegionCode,
                tenantId: config.platformTenantId,
                status: OrganizationStatus.ACTIVE,
                complianceTier: ComplianceTier.GOV_SECURE,
                dataResidency: DataResidencyZone.UK_ONLY,
                dataClassification: DataClassificationLevel.OFFICIAL,
            },
            create: {
                slug: config.platformOrgSlug,
                name: config.platformOrgName,
                regionCode: config.platformRegionCode,
                tenantId: config.platformTenantId,
                status: OrganizationStatus.ACTIVE,
                complianceTier: ComplianceTier.GOV_SECURE,
                dataResidency: DataResidencyZone.UK_ONLY,
                dataClassification: DataClassificationLevel.OFFICIAL,
            },
            select: { id: true, slug: true, name: true },
        });

        assertUuid(organization.id, 'Organization id');

        const permissions = orgRoles[config.roleName].statements as Record<string, string[]>;

        const role = await prisma.role.upsert({
            where: { orgId_name: { orgId: organization.id, name: config.roleName } },
            update: {
                scope: RoleScope.GLOBAL,
                permissions: permissions as Prisma.InputJsonValue,
            },
            create: {
                orgId: organization.id,
                name: config.roleName,
                description: 'Platform administrator',
                scope: RoleScope.GLOBAL,
                permissions: permissions as Prisma.InputJsonValue,
            },
            select: { id: true, name: true },
        });

        const timestamp = new Date();

        await prisma.membership.upsert({
            where: { orgId_userId: { orgId: organization.id, userId } },
            update: {
                roleId: role.id,
                status: MembershipStatus.ACTIVE,
                metadata: {
                    ...superAdminMetadata,
                    lastBootstrappedAt: timestamp.toISOString(),
                },
                activatedAt: timestamp,
                updatedBy: userId,
            },
            create: {
                orgId: organization.id,
                userId,
                roleId: role.id,
                status: MembershipStatus.ACTIVE,
                invitedBy: null,
                invitedAt: timestamp,
                activatedAt: timestamp,
                metadata: {
                    ...superAdminMetadata,
                    bootstrappedAt: timestamp.toISOString(),
                },
                createdBy: userId,
            },
        });

        await ensurePlatformAuthOrganization(config, organization);

        const existingMember = await prisma.authOrgMember.findFirst({
            where: { organizationId: organization.id, userId },
            select: { id: true },
        });

        if (existingMember) {
            await prisma.authOrgMember.update({
                where: { id: existingMember.id },
                data: { role: config.roleName },
            });
        } else {
            await prisma.authOrgMember.create({
                data: {
                    id: randomUUID(),
                    organizationId: organization.id,
                    userId,
                    role: config.roleName,
                },
            });
        }

        const { headers: setActiveHeaders } = await auth.api.setActiveOrganization({
            headers: request.headers,
            body: { organizationId: organization.id },
            returnHeaders: true,
        });

        const response = NextResponse.json({
            ok: true,
            orgId: organization.id,
            role: config.roleName,
            redirectTo: '/dashboard',
        });

        appendSetCookieHeaders(setActiveHeaders, response.headers);
        return response;
    } catch (error) {
        return buildErrorResponse(error);
    }
}
