import type { OrganizationSubscriptionData } from '@/server/types/billing-types';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export interface IPlatformSubscriptionRepository {
    getSubscriptionByOrgId(
        context: RepositoryAuthorizationContext,
        orgId: string,
    ): Promise<OrganizationSubscriptionData | null>;

    updateSubscriptionPrice(
        context: RepositoryAuthorizationContext,
        orgId: string,
        stripePriceId: string,
    ): Promise<OrganizationSubscriptionData>;
}
