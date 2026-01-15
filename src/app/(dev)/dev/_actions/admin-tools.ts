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
import { AuthorizationError } from '@/server/errors';
import { resolveRoleTemplate } from '@/server/security/role-templates';
import { revalidatePath } from 'next/cache';
import { runFullColdStart } from '@/server/services/platform/bootstrap/full-cold-start';

// Default admin emails
const PLATFORM_ORG_SLUG = process.env.PLATFORM_ORG_SLUG ?? 'orgcentral-platform';
const DEFAULT_DEV_ADMIN_EMAIL = 'aant1563@gmail.com';
const DEFAULT_GLOBAL_ADMIN_EMAIL = 'bdturag01@gmail.com';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';
const DEV_DASHBOARD_PATH = '/dev/dashboard';

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

        // Ensure global admin role exists
        const template = resolveRoleTemplate('globalAdmin');
        const role = await prisma.role.upsert({
            where: { orgId_name: { orgId: organization.id, name: 'globalAdmin' } },
            update: {
                scope: RoleScope.GLOBAL,
                permissions: template.permissions as Prisma.InputJsonValue,
            },
            create: {
                orgId: organization.id,
                name: 'globalAdmin',
                description: 'Platform global administrator with full access',
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

        revalidatePath(DEV_DASHBOARD_PATH);
        return { success: true, message: `Created global admin: ${normalizedEmail}`, userId: user.id };
    } catch (error) {
        const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
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

        revalidatePath(DEV_DASHBOARD_PATH);
        return {
            success: true,
            message: `Bootstrapped admins: ${DEFAULT_GLOBAL_ADMIN_EMAIL}, ${DEFAULT_DEV_ADMIN_EMAIL}`
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        return { success: false, message };
    }
}

export interface DevelopmentColdStartFailure {
    step: string;
    message: string;
}

export interface DevelopmentColdStartResult {
    success: boolean;
    message: string;
    failures?: DevelopmentColdStartFailure[];
}

export async function runDevelopmentColdStart(): Promise<DevelopmentColdStartResult> {
    try {
        assertColdStartEnabled();
        const result = await runFullColdStart({ includeDemoData: true });
        const failures = result.steps
            .filter((step) => !step.success)
            .map((step) => ({ step: step.step, message: step.message }));
        const summary = result.steps
            .filter((step) => step.success)
            .map((step) => step.step)
            .join(', ');

        revalidatePath('/dev');
        revalidatePath(DEV_DASHBOARD_PATH);
        revalidatePath('/admin');
        revalidatePath('/hr');

        return {
            success: result.success,
            message: result.success
                ? `Cold start complete. Steps: ${summary}`
                : 'Cold start finished with errors.',
            failures: failures.length ? failures : undefined,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, message };
    }
}

function assertColdStartEnabled(): void {
    const enabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_COLD_START === 'true';
    if (!enabled) {
        throw new AuthorizationError('Cold start is disabled.');
    }
}
