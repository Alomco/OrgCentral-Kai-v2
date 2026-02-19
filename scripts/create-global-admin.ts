import { stderr, stdout } from 'node:process';
import type { Prisma } from '../src/generated/client';
import {
    MembershipStatus,
    RoleScope,
    OrganizationStatus,
    ComplianceTier,
    DataResidencyZone,
    DataClassificationLevel,
} from '../src/generated/client';
import { prisma } from '../src/server/lib/prisma';

const OWNER_ROLE_PERMISSIONS: Record<string, string[]> = {
    organization: ['read', 'update', 'governance'],
    member: ['read', 'invite', 'update', 'remove'],
    invitation: ['create', 'cancel'],
    audit: ['read', 'write'],
    cache: ['tag', 'invalidate'],
    residency: ['enforce'],
};

const SCRIPT_METADATA = {
    seedSource: 'scripts/create-global-admin',
};

interface CliConfig {
    email: string;
    displayName: string;
    platformOrgSlug: string;
    platformOrgName: string;
    platformTenantId: string;
    platformRegionCode: string;
    roleName: string;
}

function resolveCliConfig(): CliConfig {
    const [, , emailArgument, displayNameArgument] = process.argv;
    if (!emailArgument || emailArgument === '--help') {
        stderr.write('Usage: pnpm tsx scripts/create-global-admin.ts <email> [displayName]\n');
        process.exit(1);
    }
    const normalizedEmail = emailArgument.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
        stderr.write('A valid email address is required.\n');
        process.exit(1);
    }
    const trimmedDisplayName =
        typeof displayNameArgument === 'string' && displayNameArgument.trim().length > 0
            ? displayNameArgument.trim()
            : undefined;
    return {
        email: normalizedEmail,
        displayName: (trimmedDisplayName ?? normalizedEmail.split('@')[0]).replace(/\s+/g, ' ').trim(),
        platformOrgSlug: process.env.PLATFORM_ORG_SLUG ?? 'orgcentral-platform',
        platformOrgName: process.env.PLATFORM_ORG_NAME ?? 'OrgCentral Platform',
        platformTenantId: process.env.PLATFORM_TENANT_ID ?? 'orgcentral-platform',
        platformRegionCode: process.env.PLATFORM_ORG_REGION ?? 'UK-LON',
        roleName: process.env.GLOBAL_ADMIN_ROLE_NAME ?? 'globalAdmin',
    };
}

async function main(): Promise<void> {
    const config = resolveCliConfig();
    stdout.write(`\nProvisioning global admin for ${config.email}\n`);
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
    });

    const role = await prisma.role.upsert({
        where: { orgId_name: { orgId: organization.id, name: config.roleName } },
        update: {
            scope: RoleScope.GLOBAL,
            permissions: OWNER_ROLE_PERMISSIONS as Prisma.InputJsonValue,
        },
        create: {
            orgId: organization.id,
            name: config.roleName,
            description: 'Platform global administrator',
            scope: RoleScope.GLOBAL,
            permissions: OWNER_ROLE_PERMISSIONS as Prisma.InputJsonValue,
        },
    });

    const user = await prisma.user.upsert({
        where: { email: config.email },
        update: {
            displayName: config.displayName,
            status: MembershipStatus.ACTIVE,
        },
        create: {
            email: config.email,
            displayName: config.displayName,
            status: MembershipStatus.ACTIVE,
        },
    });

    const timestamp = new Date();
    const membership = await prisma.membership.upsert({
        where: { orgId_userId: { orgId: organization.id, userId: user.id } },
        update: {
            roleId: role.id,
            status: MembershipStatus.ACTIVE,
            metadata: {
                ...SCRIPT_METADATA,
                roles: [config.roleName],
                lastSeededAt: timestamp.toISOString(),
            } as Prisma.InputJsonValue,
            activatedAt: timestamp,
            updatedBy: user.id,
        },
        create: {
            orgId: organization.id,
            userId: user.id,
            roleId: role.id,
            status: MembershipStatus.ACTIVE,
            invitedBy: null,
            invitedAt: timestamp,
            activatedAt: timestamp,
            metadata: {
                ...SCRIPT_METADATA,
                roles: [config.roleName],
                seededAt: timestamp.toISOString(),
            } as Prisma.InputJsonValue,
            createdBy: user.id,
        },
    });

    stdout.write(`\nGlobal admin ready:\n`);
    stdout.write(`  User ID: ${user.id}\n`);
    stdout.write(`  Organization: ${organization.name} (${organization.id})\n`);
    stdout.write(`  Role: ${role.name} (${role.id})\n`);
    stdout.write(`  Membership: org=${membership.orgId}, user=${membership.userId}\n`);
}

main()
    .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        stderr.write(`Global admin provisioning failed: ${message}\n`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
