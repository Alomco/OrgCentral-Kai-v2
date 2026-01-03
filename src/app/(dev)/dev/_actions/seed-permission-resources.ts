'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/server/lib/prisma';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PERMISSIONS } from '@/server/repositories/cache-scopes';
import { PrismaPermissionResourceRepository } from '@/server/repositories/prisma/org/permissions/prisma-permission-resource-repository';
import { seedPermissionResources } from '@/server/use-cases/org/permissions/seed-permission-resources';

const PLATFORM_ORG_SLUG = 'orgcentral-platform';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

interface SeedResult {
    success: boolean;
    message: string;
    count?: number;
}

async function getDefaultOrg() {
    const org = await prisma.organization.findFirst({
        where: { slug: PLATFORM_ORG_SLUG },
    });
    if (!org) {
        throw new Error('Platform organization not found. Run admin bootstrap first.');
    }
    return org;
}

export async function seedPermissionResourcesForDev(): Promise<SeedResult> {
    try {
        const org = await getDefaultOrg();
        const repository = new PrismaPermissionResourceRepository();

        await seedPermissionResources(
            { permissionResourceRepository: repository },
            { orgId: org.id },
        );

        const resources = await repository.listResources(org.id);
        await invalidateOrgCache(
            org.id,
            CACHE_SCOPE_PERMISSIONS,
            org.dataClassification,
            org.dataResidency,
        );

        revalidatePath('/dev/dashboard');
        revalidatePath('/org/permissions');

        return {
            success: true,
            message: `Seeded ${String(resources.length)} permission resources.`,
            count: resources.length,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        return { success: false, message };
    }
}

export async function getPermissionResourceStatus(): Promise<{
    hasPermissionResources: boolean;
    resourceCount: number;
}> {
    try {
        const org = await getDefaultOrg();
        const repository = new PrismaPermissionResourceRepository();
        const resources = await repository.listResources(org.id);
        return { hasPermissionResources: resources.length > 0, resourceCount: resources.length };
    } catch {
        return { hasPermissionResources: false, resourceCount: 0 };
    }
}
