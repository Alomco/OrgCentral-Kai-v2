import type { IPlatformSubscriptionRepository } from '@/server/repositories/contracts/platform/admin/platform-subscription-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { OrganizationSubscriptionData } from '@/server/types/billing-types';
import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import { mapOrganizationSubscriptionToData } from '@/server/repositories/mappers/org/billing/organization-subscription-mapper';
import { Prisma } from '@/server/types/prisma';

export class PrismaPlatformSubscriptionRepository
    extends BasePrismaRepository
    implements IPlatformSubscriptionRepository {
    async getSubscriptionByOrgId(
        _context: RepositoryAuthorizationContext,
        orgId: string,
    ): Promise<OrganizationSubscriptionData | null> {
        const subscription = await this.prisma.organizationSubscription.findUnique({ where: { orgId } });
        return subscription ? mapOrganizationSubscriptionToData(subscription) : null;
    }

    async updateSubscriptionPrice(
        context: RepositoryAuthorizationContext,
        orgId: string,
        stripePriceId: string,
    ): Promise<OrganizationSubscriptionData> {
        const subscription = await this.prisma.organizationSubscription.update({
            where: { orgId },
            data: {
                stripePriceId,
                dataClassification: context.dataClassification,
                residencyTag: context.dataResidency,
                metadata: Prisma.JsonNull,
            },
        });

        return mapOrganizationSubscriptionToData(subscription);
    }
}
