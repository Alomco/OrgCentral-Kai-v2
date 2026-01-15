import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AcceptInvitationResult } from '@/server/use-cases/auth/accept-invitation';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { MembershipStatus } from '@/server/types/prisma';
import type { Membership } from '@/server/types/membership';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';
import { assertDependency } from '@/server/use-cases/shared';
import { updateMembershipStatus as updateMembershipStatusUseCase } from '@/server/use-cases/org/membership/update-membership-status';
import { invalidateIdentityCache } from './membership-service.helpers';
import {
    ORG_MEMBERSHIP_RESOURCE_TYPE,
    recordMembershipAuditEvent,
} from './membership-service.policy';
import type {
    AcceptInvitationExecutor,
    AcceptInvitationServiceInput,
    MembershipServiceDependencies,
} from './membership-service.types';
import {
    handleBulkUpdateMembershipRoles,
    handleInviteMember,
    handleUpdateMembershipRoles,
    runInvitationAcceptance,
} from './membership-service.handlers';

export class MembershipService extends AbstractOrgService {
    private readonly dependencies: MembershipServiceDependencies;

    constructor(dependencies: MembershipServiceDependencies) {
        super();
        this.dependencies = dependencies;
    }

    async acceptInvitation(input: AcceptInvitationServiceInput): Promise<AcceptInvitationResult> {
        const executor: AcceptInvitationExecutor = {
            buildContext: (authorization, options) => this.buildContext(authorization, options),
            execute: (context, action, handler) => this.executeInServiceContext(context, action, handler),
        };

        return runInvitationAcceptance({
            dependencies: this.dependencies,
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            buildContext: executor.buildContext,
            executeInServiceContext: executor.execute,
        }, input);
    }

    async updateMembershipRoles(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
        roles: string[];
    }): Promise<Membership> {
        return handleUpdateMembershipRoles({
            dependencies: this.dependencies,
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            buildContext: this.buildContext.bind(this),
            executeInServiceContext: this.executeInServiceContext.bind(this),
        }, input);
    }

    async bulkUpdateMembershipRoles(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserIds: string[];
        roles: string[];
    }): Promise<void> {
        await handleBulkUpdateMembershipRoles({
            dependencies: this.dependencies,
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            buildContext: this.buildContext.bind(this),
            executeInServiceContext: this.executeInServiceContext.bind(this),
        }, input);
    }

    async inviteMember(input: {
        authorization: RepositoryAuthorizationContext;
        email: string;
        roles: string[];
        request?: {
            ipAddress?: string;
            userAgent?: string;
            securityContext?: Record<string, unknown>;
        };
    }): Promise<{ token: string; alreadyInvited: boolean }> {
        return handleInviteMember({
            dependencies: this.dependencies,
            ensureOrgAccess: this.ensureOrgAccess.bind(this),
            buildContext: this.buildContext.bind(this),
            executeInServiceContext: this.executeInServiceContext.bind(this),
        }, input);
    }

    async suspendMembership(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
    }): Promise<void> {
        await this.ensureOrgAccess(input.authorization, {
            action: 'org.membership.suspend',
            resourceType: ORG_MEMBERSHIP_RESOURCE_TYPE,
            resourceAttributes: { targetUserId: input.targetUserId },
        });
        await this.updateMembershipStatus(
            { authorization: input.authorization, targetUserId: input.targetUserId, status: MembershipStatus.SUSPENDED },
        );
    }

    async resumeMembership(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
    }): Promise<void> {
        await this.ensureOrgAccess(input.authorization, {
            action: 'org.membership.resume',
            resourceType: ORG_MEMBERSHIP_RESOURCE_TYPE,
            resourceAttributes: { targetUserId: input.targetUserId },
        });
        await this.updateMembershipStatus(
            { authorization: input.authorization, targetUserId: input.targetUserId, status: MembershipStatus.ACTIVE },
        );
    }

    private async updateMembershipStatus(params: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
        status: MembershipStatus;
    }): Promise<void> {
        const { authorization, targetUserId, status } = params;
        const membershipRepository = this.dependencies.membershipRepository;
        assertDependency(membershipRepository, 'membershipRepository');

        const context: ServiceExecutionContext = this.buildContext(authorization, {
            correlationId: authorization.correlationId,
            metadata: { targetUserId, status },
        });

        await this.executeInServiceContext(context, 'identity.update-status', async () => {
            await updateMembershipStatusUseCase(
                { membershipRepository },
                { authorization, targetUserId, status },
            );
            await invalidateIdentityCache(authorization);
            await this.dependencies.billingService?.syncSeats({ authorization });
            await recordMembershipAuditEvent(authorization, targetUserId, {
                targetUserId,
                status,
            }, 'status.updated');
        });
    }
}

export type {
    MembershipServiceDependencies,
    AcceptInvitationServiceInput,
} from './membership-service.types';
