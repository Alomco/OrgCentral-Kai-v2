import { stderr, stdout } from 'node:process';
import type { Prisma } from '@prisma/client';
import {
    MembershipStatus,
    RoleScope,
    OrganizationStatus,
    ComplianceTier,
    DataResidencyZone,
    DataClassificationLevel,
} from '@prisma/client';
import { prisma } from '../src/server/lib/prisma';
import { hashCredentialPassword } from './test-accounts/password';
import { randomUUID } from 'node:crypto';
import { getAuthOrganizationBridgeService } from '../src/server/services/auth/auth-organization-bridge-service.provider';

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
    password: string;
    platformOrgSlug: string;
    platformOrgName: string;
    platformTenantId: string;
    platformRegionCode: string;
    roleName: string;
}

function resolveCliConfig(): CliConfig {
    const [, , emailArgument, displayNameArgument, passwordArgument] = process.argv;
    if (!emailArgument || emailArgument === '--help') {
        stderr.write('Usage: pnpm tsx scripts/create-global-admin.ts <email> [displayName] [password]\n');
        stderr.write('  email: Email address for the admin user\n');
        stderr.write('  displayName: Display name (optional, defaults to email prefix)\n');
        stderr.write('  password: Password for login (optional, defaults to TestPass!234567)\n');
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
    const password = passwordArgument && passwordArgument.trim().length > 0
        ? passwordArgument.trim()
        : 'TestPass!234567';
    
    return {
        email: normalizedEmail,
        displayName: (trimmedDisplayName ?? normalizedEmail.split('@')[0]).replace(/\s+/g, ' ').trim(),
        password,
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

    // Create auth user and account for login
    const authUser = await prisma.authUser.upsert({
        where: { email: config.email },
        update: {
            name: config.displayName,
            emailVerified: true,
        },
        create: {
            id: randomUUID(),
            email: config.email,
            name: config.displayName,
            emailVerified: true,
        },
    });

    const hashedPassword = await hashCredentialPassword(config.password);
    const existingAuthAccount = await prisma.authAccount.findFirst({
        where: { userId: authUser.id, providerId: 'credential' },
        select: { id: true },
    });

    if (!existingAuthAccount) {
        await prisma.authAccount.create({
            data: {
                id: randomUUID(),
                userId: authUser.id,
                accountId: authUser.id,
                providerId: 'credential',
                password: hashedPassword,
            },
        });
    } else {
        await prisma.authAccount.update({
            where: { id: existingAuthAccount.id },
            data: { password: hashedPassword },
        });
    }

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

    // Create Better Auth organization and membership
    const authBridgeService = getAuthOrganizationBridgeService({ prisma });
    await authBridgeService.ensureAuthOrganizationBridge(
        organization.id,
        authUser.id,
        'owner', // Use 'owner' role for global admin
    );

    stdout.write(`\nGlobal admin ready:\n`);
    stdout.write(`  User ID: ${user.id}\n`);
    stdout.write(`  Auth User ID: ${authUser.id}\n`);
    stdout.write(`  Email: ${config.email}\n`);
    stdout.write(`  Password: ${config.password}\n`);
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
