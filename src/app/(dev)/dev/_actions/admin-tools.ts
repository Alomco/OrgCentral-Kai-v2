'use server';

import type { Prisma } from '@prisma/client';
import {
    MembershipStatus,
    RoleScope,
    OrganizationStatus,
    ComplianceTier,
    DataResidencyZone,
    DataClassificationLevel,
} from '@prisma/client';
import { prisma } from '@/server/lib/prisma';
import { resolveRoleTemplate } from '@/server/security/role-templates';
import { revalidatePath } from 'next/cache';

// Default admin emails
const PLATFORM_ORG_SLUG = 'orgcentral-platform';
const DEFAULT_DEV_ADMIN_EMAIL = 'aant1563@gmail.com';
const DEFAULT_GLOBAL_ADMIN_EMAIL = 'bdturag01@gmail.com';

interface AdminUser {
    id: string;
    email: string;
    displayName: string | null;
    roleKey: string;
    createdAt: Date;
}

export async function listGlobalAdmins(): Promise<AdminUser[]> {
    const platformOrg = await prisma.organization.findFirst({
        where: { slug: PLATFORM_ORG_SLUG },
    });

    if (!platformOrg) {
        return [];
    }

    const memberships = await prisma.membership.findMany({
        where: {
            orgId: platformOrg.id,
            status: MembershipStatus.ACTIVE,
        },
        include: {
            user: true,
            role: true,
        },
    });

    return memberships.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        displayName: m.user.displayName,
        roleKey: m.role?.name ?? 'unknown',
        createdAt: m.user.createdAt,
    }));
}

export async function createGlobalAdmin(email: string, displayName?: string): Promise<{
    success: boolean;
    message: string;
    userId?: string;
}> {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.includes('@')) {
            return { success: false, message: 'Invalid email address' };
        }

        const resolvedDisplayName = displayName?.trim() ?? normalizedEmail.split('@')[0];

        // Ensure platform organization exists
        const organization = await prisma.organization.upsert({
            where: { slug: PLATFORM_ORG_SLUG },
            update: {},
            create: {
                slug: PLATFORM_ORG_SLUG,
                name: 'OrgCentral Platform',
                regionCode: 'UK-LON',
                tenantId: PLATFORM_ORG_SLUG,
                status: OrganizationStatus.ACTIVE,
                complianceTier: ComplianceTier.GOV_SECURE,
                dataResidency: DataResidencyZone.UK_ONLY,
                dataClassification: DataClassificationLevel.OFFICIAL,
            },
        }) as { id: string };

        // Ensure owner role exists (uses 'owner' to match OrgRoleKey for ABAC)
        const template = resolveRoleTemplate('owner');
        const role = await prisma.role.upsert({
            where: { orgId_name: { orgId: organization.id, name: 'owner' } },
            update: {
                scope: RoleScope.GLOBAL,
                permissions: template.permissions as Prisma.InputJsonValue,
            },
            create: {
                orgId: organization.id,
                name: 'owner',
                description: 'Platform owner with full administrative access',
                scope: RoleScope.GLOBAL,
                permissions: template.permissions as Prisma.InputJsonValue,
            },
        });

        // Create or update user
        const user = await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
                displayName: resolvedDisplayName,
                status: MembershipStatus.ACTIVE,
            },
            create: {
                email: normalizedEmail,
                displayName: resolvedDisplayName,
                status: MembershipStatus.ACTIVE,
            },
        });

        // Create membership
        const timestamp = new Date();
        await prisma.membership.upsert({
            where: { orgId_userId: { orgId: organization.id, userId: user.id } },
            update: {
                roleId: role.id,
                status: MembershipStatus.ACTIVE,
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
                    source: 'dev-dashboard',
                    createdAt: timestamp.toISOString(),
                } as Prisma.InputJsonValue,
                createdBy: user.id,
            },
        });

        revalidatePath('/dev/dashboard');
        return { success: true, message: `Created global admin: ${normalizedEmail}`, userId: user.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

export async function bootstrapDefaultAdmins(): Promise<{
    success: boolean;
    message: string;
}> {
    try {
        await createGlobalAdmin(DEFAULT_GLOBAL_ADMIN_EMAIL, 'Global Admin');
        await createGlobalAdmin(DEFAULT_DEV_ADMIN_EMAIL, 'Dev Admin');

        revalidatePath('/dev/dashboard');
        return {
            success: true,
            message: `Bootstrapped admins: ${DEFAULT_GLOBAL_ADMIN_EMAIL}, ${DEFAULT_DEV_ADMIN_EMAIL}`
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}
