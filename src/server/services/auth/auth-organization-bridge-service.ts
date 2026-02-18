import { randomUUID } from 'node:crypto';
import type { PrismaClientInstance } from '@/server/types/prisma';
import { AbstractBaseService } from '@/server/services/abstract-base-service';

export interface AuthOrganizationBridgeServiceDependencies {
    prisma: PrismaClientInstance;
}

export class AuthOrganizationBridgeService extends AbstractBaseService {
    private readonly prisma: PrismaClientInstance;

    constructor(dependencies: AuthOrganizationBridgeServiceDependencies) {
        super();
        this.prisma = dependencies.prisma;
    }

    async ensureAuthOrganizationBridge(
        orgId: string,
        userId: string,
        roleNameOverride: string | null,
    ): Promise<void> {
        const organization = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: { id: true, name: true, slug: true },
        });

        if (!organization) {
            return;
        }

        await this.prisma.authOrganization.upsert({
            where: { id: organization.id },
            update: { name: organization.name, slug: organization.slug },
            create: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                metadata: JSON.stringify({ seedSource: 'post-login' }),
            },
        });

        const roleName = roleNameOverride ?? 'member';

        const authMember = await this.prisma.authOrgMember.findFirst({
            where: { organizationId: organization.id, userId },
            select: { id: true },
        });

        if (authMember) {
            await this.prisma.authOrgMember.update({
                where: { id: authMember.id },
                data: { role: roleName },
            });
        } else {
            await this.prisma.authOrgMember.create({
                data: {
                    id: randomUUID(),
                    organizationId: organization.id,
                    userId,
                    role: roleName,
                },
            });
        }
    }
}