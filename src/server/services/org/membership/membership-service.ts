import { ValidationError } from '@/server/errors';
import { EntityNotFoundError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AcceptInvitationResult } from '@/server/use-cases/auth/accept-invitation';
import { acceptInvitation, type AcceptInvitationDependencies } from '@/server/use-cases/auth/accept-invitation';
import type { ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { MembershipStatus } from '@prisma/client';
import { MembershipStatus as PrismaMembershipStatus } from '@prisma/client';
import type { Membership } from '@/server/types/membership';
import { AbstractOrgService } from '@/server/services/org/abstract-org-service';
import { assertDependency } from '@/server/use-cases/shared';
import { updateMembershipRoles as updateMembershipRolesUseCase } from '@/server/use-cases/org/membership/update-membership-roles';
import { updateMembershipStatus as updateMembershipStatusUseCase } from '@/server/use-cases/org/membership/update-membership-status';
import { normalizeRoles } from '@/server/use-cases/shared';
import { buildAuthorizationContext, invalidateIdentityCache } from './membership-service.helpers';
import type { BillingServiceContract } from '@/server/services/billing/billing-service.provider';
import {
    enforceInviteRolePolicy,
    ORG_MEMBERSHIP_RESOURCE_TYPE,
    recordMembershipAuditEvent,
} from './membership-service.policy';

export type MembershipServiceDependencies = AcceptInvitationDependencies & {
    billingService?: BillingServiceContract;
};

export interface AcceptInvitationServiceInput {
    token: string;
    actor: {
        userId: string;
        email: string;
    };
    correlationId?: string;
}

export class MembershipService extends AbstractOrgService {
    private readonly dependencies: MembershipServiceDependencies;

    constructor(dependencies: MembershipServiceDependencies) {
        super();
        this.dependencies = dependencies;
    }

    async acceptInvitation(input: AcceptInvitationServiceInput): Promise<AcceptInvitationResult> {
        const invitation = await this.dependencies.invitationRepository.findByToken(input.token.trim());
        if (!invitation) {
            throw new EntityNotFoundError('Invitation', { token: input.token });
        }

        const authorization = await buildAuthorizationContext({
            organizationRepository: this.dependencies.organizationRepository,
            orgId: invitation.organizationId,
            userId: input.actor.userId,
            correlationId: input.correlationId,
        });

        const context: ServiceExecutionContext = this.buildContext(authorization, {
            correlationId: authorization.correlationId,
        });

        const deps: AcceptInvitationDependencies = {
            invitationRepository: this.dependencies.invitationRepository,
            userRepository: this.dependencies.userRepository,
            membershipRepository: this.dependencies.membershipRepository,
            organizationRepository: this.dependencies.organizationRepository,
            generateEmployeeNumber: this.dependencies.generateEmployeeNumber,
            employeeProfileRepository: this.dependencies.employeeProfileRepository,
            checklistTemplateRepository: this.dependencies.checklistTemplateRepository,
            checklistInstanceRepository: this.dependencies.checklistInstanceRepository,
        };

        const result = await this.executeInServiceContext(context, 'identity.accept-invitation', () =>
            acceptInvitation(deps, input),
        );
        await this.dependencies.billingService?.syncSeats({ authorization });
        return result;
    }

    async updateMembershipRoles(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
        roles: string[];
    }): Promise<Membership> {
        await this.ensureOrgAccess(input.authorization, {
            action: 'org.membership.update-roles',
            resourceType: ORG_MEMBERSHIP_RESOURCE_TYPE,
            resourceAttributes: {
                targetUserId: input.targetUserId,
                roles: input.roles,
            },
        });

        const context: ServiceExecutionContext = this.buildContext(input.authorization, {
            correlationId: input.authorization.correlationId,
            metadata: { targetUserId: input.targetUserId },
        });

        return this.executeInServiceContext(context, 'identity.update-roles', async () => {
            const { membership } = await updateMembershipRolesUseCase(
                { userRepository: this.dependencies.userRepository },
                {
                    authorization: input.authorization,
                    targetUserId: input.targetUserId,
                    roles: input.roles,
                },
            );
            await invalidateIdentityCache(input.authorization);
            await recordMembershipAuditEvent(input.authorization, input.targetUserId, {
                targetUserId: input.targetUserId,
                roles: membership.roles,
            }, 'roles.updated');
            return membership;
        });
    }

    async inviteMember(input: {
        authorization: RepositoryAuthorizationContext;
        email: string;
        roles: string[];
    }): Promise<{ token: string; alreadyInvited: boolean }> {
        await this.ensureOrgAccess(input.authorization, {
            action: 'org.invitation.create',
            resourceType: 'org.invitation',
            resourceAttributes: {
                email: input.email,
                roles: input.roles,
            },
            requiredPermissions: { member: ['invite'] },
        });

        const invitationRepository = this.dependencies.invitationRepository;
        const organizationRepository = this.dependencies.organizationRepository;
        assertDependency(invitationRepository, 'invitationRepository');

        const normalizedEmail = input.email.trim().toLowerCase();
        const roles = normalizeRoles(input.roles);
        const normalizedRoles = roles.length > 0 ? roles : ['member'];
        enforceInviteRolePolicy(input.authorization, normalizedRoles);

        const existing = await invitationRepository.getActiveInvitationByEmail(
            input.authorization.orgId,
            normalizedEmail,
        );

        if (existing) {
            return { token: existing.token, alreadyInvited: true };
        }

        const organization = await organizationRepository?.getOrganization(input.authorization.orgId);
        const organizationName = organization?.name ?? input.authorization.orgId;

        const context: ServiceExecutionContext = this.buildContext(input.authorization, {
            correlationId: input.authorization.correlationId,
            metadata: { email: normalizedEmail, roles },
        });

        return this.executeInServiceContext(context, 'identity.invite-member', async () => {
            if (!normalizedEmail) {
                throw new ValidationError('Email is required to invite a member.', { email: input.email });
            }

            const invitation = await invitationRepository.createInvitation({
                orgId: input.authorization.orgId,
                organizationName,
                targetEmail: normalizedEmail,
                invitedByUserId: input.authorization.userId,
                onboardingData: {
                    email: normalizedEmail,
                    displayName: '',
                    roles: normalizedRoles,
                },
                metadata: {
                    auditSource: input.authorization.auditSource,
                    correlationId: input.authorization.correlationId,
                    dataResidency: input.authorization.dataResidency,
                    dataClassification: input.authorization.dataClassification,
                },
            });

            return { token: invitation.token, alreadyInvited: false };
        });
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
            { authorization: input.authorization, targetUserId: input.targetUserId, status: PrismaMembershipStatus.SUSPENDED },
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
            { authorization: input.authorization, targetUserId: input.targetUserId, status: PrismaMembershipStatus.ACTIVE },
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
