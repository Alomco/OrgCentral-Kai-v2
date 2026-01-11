import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { AuthorizationError, ValidationError } from '@/server/errors';
import { isOrgRoleKey, type OrgRoleKey } from '@/server/security/access-control';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_PLATFORM_ORG_SLUG = 'orgcentral-platform';
const DEFAULT_PLATFORM_ORG_NAME = 'OrgCentral Platform';
const DEFAULT_PLATFORM_TENANT_ID = 'orgcentral-platform';
const DEFAULT_PLATFORM_REGION_CODE = 'UK-LON';
const DEFAULT_GLOBAL_ADMIN_ROLE: OrgRoleKey = 'owner';
export const BOOTSTRAP_SEED_SOURCE = 'api/auth/admin-bootstrap';

export interface PlatformBootstrapConfig {
    platformOrgSlug: string;
    platformOrgName: string;
    platformTenantId: string;
    platformRegionCode: string;
    roleName: OrgRoleKey;
}

export function resolvePlatformConfig(): PlatformBootstrapConfig {
    const roleCandidate = process.env.GLOBAL_ADMIN_ROLE_NAME ?? DEFAULT_GLOBAL_ADMIN_ROLE;

    if (!isOrgRoleKey(roleCandidate)) {
        throw new ValidationError('GLOBAL_ADMIN_ROLE_NAME must be one of the built-in role keys.');
    }

    return {
        platformOrgSlug: process.env.PLATFORM_ORG_SLUG ?? DEFAULT_PLATFORM_ORG_SLUG,
        platformOrgName: process.env.PLATFORM_ORG_NAME ?? DEFAULT_PLATFORM_ORG_NAME,
        platformTenantId: process.env.PLATFORM_TENANT_ID ?? DEFAULT_PLATFORM_TENANT_ID,
        platformRegionCode: process.env.PLATFORM_ORG_REGION ?? DEFAULT_PLATFORM_REGION_CODE,
        roleName: roleCandidate,
    };
}

export function isBootstrapEnabled(): boolean {
    return process.env.ENABLE_ADMIN_BOOTSTRAP === 'true';
}

export function requireBootstrapSecret(): string {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (typeof secret !== 'string' || secret.trim().length === 0) {
        throw new AuthorizationError('Admin bootstrap is disabled.');
    }
    return secret;
}

export function constantTimeEquals(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) {
        return false;
    }
    return timingSafeEqual(aBuffer, bBuffer);
}

function isUuid(value: string): boolean {
    return UUID_REGEX.test(value);
}

export function assertUuid(value: string, name: string): void {
    if (!isUuid(value)) {
        throw new ValidationError(`${name} must be a UUID. Configure Better Auth to generate UUID ids.`);
    }
}

async function resolveCanonicalAuthUserId(
    prisma: PrismaClient,
    authUserId: string,
    email: string,
): Promise<string> {
    if (isUuid(authUserId)) {
        return authUserId;
    }

    const existingTenantUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existingTenantUser?.id) {
        return existingTenantUser.id;
    }

    return randomUUID();
}

export async function ensureAuthUserIdIsUuid(
    prisma: PrismaClient,
    authUserId: string,
    email: string,
): Promise<string> {
    const canonicalUserId = await resolveCanonicalAuthUserId(prisma, authUserId, email);

    if (canonicalUserId === authUserId) {
        return canonicalUserId;
    }

    if (!isUuid(canonicalUserId)) {
        throw new ValidationError('Failed to resolve a UUID user id for bootstrap.');
    }

    const conflictingAuthUser = await prisma.authUser.findUnique({
        where: { id: canonicalUserId },
        select: { id: true },
    });

    if (conflictingAuthUser) {
        throw new ValidationError(
            'Cannot remap auth user id during bootstrap because the target id already exists.',
        );
    }

    await prisma.authUser.update({
        where: { id: authUserId },
        data: { id: canonicalUserId },
    });

    return canonicalUserId;
}

export async function ensurePlatformAuthOrganization(
    prisma: PrismaClient,
    input: PlatformBootstrapConfig,
    organization: { id: string; slug: string; name: string },
): Promise<void> {
    const authOrgBySlug = await prisma.authOrganization.findUnique({
        where: { slug: input.platformOrgSlug },
        select: { id: true },
    });

    const authOrgById = await prisma.authOrganization.findUnique({
        where: { id: organization.id },
        select: { id: true },
    });

    if (authOrgBySlug && authOrgBySlug.id !== organization.id) {
        if (authOrgById) {
            throw new ValidationError(
                'Multiple auth organizations conflict with the platform slug/id. Delete stale auth org records and retry.',
            );
        }

        await prisma.authOrganization.update({
            where: { id: authOrgBySlug.id },
            data: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
            },
        });

        await prisma.authSession.updateMany({
            where: { activeOrganizationId: authOrgBySlug.id },
            data: { activeOrganizationId: organization.id },
        });

        return;
    }

    await prisma.authOrganization.upsert({
        where: { id: organization.id },
        update: {
            name: organization.name,
            slug: organization.slug,
        },
        create: {
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            metadata: JSON.stringify({
                seedSource: BOOTSTRAP_SEED_SOURCE,
            }),
        },
    });
}
