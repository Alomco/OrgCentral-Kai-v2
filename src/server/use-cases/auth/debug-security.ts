import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/server/lib/prisma';

export interface DebugOrgSummary {
    id: string;
    slug: string;
    name: string;
}

export interface DebugSecurityDependencies {
    prisma: PrismaClient;
}

export type DebugSecurityOverrides = Partial<DebugSecurityDependencies>;

export async function listSessionOrganizations(
    userId: string,
    overrides: DebugSecurityOverrides = {},
): Promise<DebugOrgSummary[]> {
    const prisma = overrides.prisma ?? defaultPrisma;
    const memberships = await prisma.authOrgMember.findMany({
        where: { userId },
        select: {
            organization: {
                select: { id: true, slug: true, name: true },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
    });

    return memberships
        .map((row) => row.organization)
        .filter((org): org is DebugOrgSummary => {
            const { id, slug, name } = org;
            return Boolean(id && slug && name);
        });
}
