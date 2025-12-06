import { randomUUID } from 'node:crypto';
import { EntityNotFoundError } from '@/server/errors';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AcceptInvitationResult } from '@/server/use-cases/auth/accept-invitation';
import { acceptInvitation, type AcceptInvitationDependencies } from '@/server/use-cases/auth/accept-invitation';
import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import { resolveIdentityCacheScopes } from '@/server/lib/cache-tags/identity';
import { invalidateCache } from '@/server/lib/cache-tags';
import type { MembershipStatus } from '@prisma/client';
import { MembershipStatus as PrismaMembershipStatus } from '@prisma/client';
import type { Membership } from '@/server/types/membership';

export type MembershipServiceDependencies = AcceptInvitationDependencies;

export interface AcceptInvitationServiceInput {
    token: string;
    actor: {
        userId: string;
        email: string;
    };
    correlationId?: string;
}

export class MembershipService extends AbstractBaseService {
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

        const authorization = await this.buildAuthorizationContext(
            invitation.organizationId,
            input.actor.userId,
            input.correlationId,
        );

        const context: ServiceExecutionContext = {
            authorization,
            correlationId: authorization.correlationId,
        };

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

        return this.executeInServiceContext(context, 'identity.accept-invitation', () =>
            acceptInvitation(deps, input),
        );
    }

    async updateMembershipRoles(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
        roles: string[];
    }): Promise<Membership> {
        const context: ServiceExecutionContext = {
            authorization: input.authorization,
            correlationId: input.authorization.correlationId,
        };

        return this.executeInServiceContext(context, 'identity.update-roles', async () => {
            const user = await this.dependencies.userRepository.getUser(
                input.authorization.orgId,
                input.targetUserId,
            );
            if (!user) {
                throw new EntityNotFoundError('User', { userId: input.targetUserId });
            }
            const memberships = user.memberships;
            let updatedMembership: Membership | undefined;
            const nextMemberships = memberships.map((membership) => {
                if (membership.organizationId !== input.authorization.orgId) {
                    return membership;
                }
                const roles = Array.from(new Set(input.roles));
                updatedMembership = { ...membership, roles };
                return updatedMembership;
            });

            if (!updatedMembership) {
                throw new EntityNotFoundError('Membership', {
                    orgId: input.authorization.orgId,
                    userId: input.targetUserId,
                });
            }

            await this.dependencies.userRepository.updateUserMemberships(
                input.authorization.orgId,
                input.targetUserId,
                nextMemberships,
            );
            await this.invalidateIdentityCache(input.authorization);

            return updatedMembership;
        });
    }

    async suspendMembership(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
    }): Promise<void> {
        await this.updateMembershipStatus(input.authorization, input.targetUserId, PrismaMembershipStatus.SUSPENDED);
    }

    async resumeMembership(input: {
        authorization: RepositoryAuthorizationContext;
        targetUserId: string;
    }): Promise<void> {
        await this.updateMembershipStatus(input.authorization, input.targetUserId, PrismaMembershipStatus.ACTIVE);
    }

    private async buildAuthorizationContext(
        orgId: string,
        userId: string,
        correlationId?: string,
    ): Promise<RepositoryAuthorizationContext> {
        const organization = await this.dependencies.organizationRepository?.getOrganization(orgId);
        const dataClassification: DataClassificationLevel =
            organization?.dataClassification ?? 'OFFICIAL';
        const dataResidency: DataResidencyZone = organization?.dataResidency ?? 'UK_ONLY';
        const auditSource = 'identity.accept-invitation';
        const correlation = correlationId ?? randomUUID();

        return {
            orgId,
            userId,
            roleKey: 'custom',
            dataResidency,
            dataClassification,
            auditSource,
            auditBatchId: undefined,
            correlationId: correlation,
            tenantScope: {
                orgId,
                dataResidency,
                dataClassification,
                auditSource,
                auditBatchId: undefined,
            },
        };
    }

    private async updateMembershipStatus(
        authorization: RepositoryAuthorizationContext,
        targetUserId: string,
        status: MembershipStatus,
    ): Promise<void> {
        if (!this.dependencies.membershipRepository) {
            throw new Error('Membership repository is required to update membership status.');
        }

        const context: ServiceExecutionContext = {
            authorization,
            correlationId: authorization.correlationId,
        };

        await this.executeInServiceContext(context, 'identity.update-status', async () => {
            await this.dependencies.membershipRepository?.updateMembershipStatus(
                authorization,
                targetUserId,
                status,
            );
            await this.invalidateIdentityCache(authorization);
        });
    }

    private async invalidateIdentityCache(authorization: RepositoryAuthorizationContext): Promise<void> {
        const scopes = resolveIdentityCacheScopes();
        await Promise.all(
            scopes.map((scope) =>
                invalidateCache({
                    orgId: authorization.orgId,
                    scope,
                    classification: authorization.dataClassification,
                    residency: authorization.dataResidency,
                }),
            ),
        );
    }
}
