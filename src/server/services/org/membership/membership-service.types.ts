import type { AcceptInvitationDependencies, AcceptInvitationInput } from '@/server/use-cases/auth/accept-invitation';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { BillingServiceContract } from '@/server/services/billing/billing-service.provider';
import type { NotificationComposerContract } from '@/server/repositories/contracts/notifications/notification-composer-contract';

export interface MembershipServiceDependencies extends AcceptInvitationDependencies {
    billingService?: BillingServiceContract;
    notificationComposer?: NotificationComposerContract;
}

export interface AcceptInvitationServiceInput extends AcceptInvitationInput {
    actor: {
        userId: string;
        email: string;
    };
}

export interface AcceptInvitationExecutor {
    buildContext: (
        authorization: RepositoryAuthorizationContext,
        options?: Partial<ServiceExecutionContext>,
    ) => ServiceExecutionContext;
    execute: <T>(context: ServiceExecutionContext, action: string, handler: () => Promise<T>) => Promise<T>;
}
