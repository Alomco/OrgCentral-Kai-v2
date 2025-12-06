import { EntityNotFoundError } from '@/server/errors';
import type { IInvitationRepository } from '@/server/repositories/contracts/auth/invitations/invitation-repository-contract';
import type { InvitationRecord } from '@/server/repositories/contracts/auth/invitations/invitation-repository.types';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IChecklistTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { organizationToTenantScope } from '@/server/security/guards';
import type { OrganizationData } from '@/server/types/leave-types';
import {
    normalizeActor,
    normalizeToken,
    normalizeRoles,
    assertEmailMatch,
    assertNotExpired,
    assertStatus,
    buildAuthorizationContext,
    type NormalizedActor,
} from '@/server/use-cases/shared';
import {
    buildEmployeeProfilePayload,
    buildUserActivationPayload,
    defaultEmployeeNumberGenerator,
    resolvePreboardingProfilePayload,
    maybeInstantiateChecklistInstance,
    extractEmployeeNumber,
} from '@/server/use-cases/auth/accept-invitation.helpers';

export interface AcceptInvitationDependencies {
    invitationRepository: IInvitationRepository;
    userRepository: IUserRepository;
    membershipRepository?: IMembershipRepository;
    organizationRepository?: IOrganizationRepository;
    employeeProfileRepository?: IEmployeeProfileRepository;
    checklistTemplateRepository?: IChecklistTemplateRepository;
    checklistInstanceRepository?: IChecklistInstanceRepository;
    generateEmployeeNumber?: () => string;
}

export interface AcceptInvitationInput {
    token: string;
    actor: {
        userId: string;
        email: string;
    };
}

export interface AcceptInvitationResult {
    success: true;
    organizationId: string;
    organizationName: string;
    roles: string[];
    alreadyMember: boolean;
    employeeNumber?: string;
}

export async function acceptInvitation(
    deps: AcceptInvitationDependencies,
    input: AcceptInvitationInput,
): Promise<AcceptInvitationResult> {
    const token = normalizeToken(input.token);
    const actor = normalizeActor(input.actor);

    const record = await deps.invitationRepository.findByToken(token);
    if (!record) {
        throw new EntityNotFoundError('Invitation', { token });
    }

    assertInvitationCanBeAccepted(record, actor.email, token);

    const membershipRoles = resolveRoles(record);
    const membershipOutcome = await ensureMembershipAndOnboarding(deps, record, actor, membershipRoles);

    await deps.invitationRepository.updateStatus(token, {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedByUserId: actor.userId,
    });

    return {
        success: true,
        organizationId: record.organizationId,
        organizationName: record.organizationName,
        roles: membershipRoles,
        alreadyMember: membershipOutcome.alreadyMember,
        employeeNumber: membershipOutcome.employeeNumber,
    };
}

function assertInvitationCanBeAccepted(record: InvitationRecord, actorEmail: string, token: string): void {
    assertStatus(record.status, 'pending', 'Invitation', { token });
    assertNotExpired(record.expiresAt, 'Invitation', { token });
    assertEmailMatch(
        actorEmail,
        record.targetEmail,
        'This invitation was issued to a different email address.',
    );
}

function resolveRoles(record: InvitationRecord): string[] {
    return normalizeRoles(record.onboardingData.roles);
}

interface MembershipOutcome {
    alreadyMember: boolean;
    employeeNumber?: string;
}

async function ensureMembershipAndOnboarding(
    deps: AcceptInvitationDependencies,
    record: InvitationRecord,
    actor: NormalizedActor,
    roles: string[],
): Promise<MembershipOutcome> {
    const existingUser = await deps.userRepository.getUser(record.organizationId, actor.userId);
    const alreadyMember = existingUser?.memberOf.includes(record.organizationId) ?? false;

    if (alreadyMember) {
        return { alreadyMember: true };
    }

    if (deps.membershipRepository && deps.organizationRepository) {
        const context = await buildMembershipContext(
            deps.organizationRepository,
            record.organizationId,
            actor.userId,
        );
        const preboardingProfile = await resolvePreboardingProfilePayload(
            deps.employeeProfileRepository,
            record,
            actor.userId,
        );
        const profilePayload =
            preboardingProfile ??
            buildEmployeeProfilePayload(
                record,
                actor.userId,
                deps.generateEmployeeNumber ?? defaultEmployeeNumberGenerator,
            );
        const userUpdate = buildUserActivationPayload(record);

        await deps.membershipRepository.createMembershipWithProfile(context, {
            userId: actor.userId,
            invitedByUserId: record.invitedByUserId ?? record.invitedByUid,
            roles,
            profile: profilePayload,
            userUpdate,
        });

        await maybeInstantiateChecklistInstance({
            record,
            employeeNumber: profilePayload.employeeNumber,
            templateRepository: deps.checklistTemplateRepository,
            instanceRepository: deps.checklistInstanceRepository,
        });

        return { alreadyMember: false, employeeNumber: profilePayload.employeeNumber };
    }

    await deps.userRepository.addUserToOrganization(
        record.organizationId,
        actor.userId,
        record.organizationId,
        record.organizationName,
        roles,
    );

    const fallbackEmployeeNumber = extractEmployeeNumber(record);
    await maybeInstantiateChecklistInstance({
        record,
        employeeNumber: fallbackEmployeeNumber,
        templateRepository: deps.checklistTemplateRepository,
        instanceRepository: deps.checklistInstanceRepository,
    });

    return { alreadyMember: false, employeeNumber: fallbackEmployeeNumber };
}

async function buildMembershipContext(
    organizationRepository: IOrganizationRepository,
    orgId: string,
    userId: string,
): Promise<RepositoryAuthorizationContext> {
    const organization = await organizationRepository.getOrganization(orgId);
    if (!organization) {
        throw new EntityNotFoundError('Organization', { orgId });
    }
    return mapOrganizationToContext(organization, userId);
}

function mapOrganizationToContext(
    organization: OrganizationData,
    userId: string,
): RepositoryAuthorizationContext {
    const tenantScope = organizationToTenantScope(organization);
    return buildAuthorizationContext({
        orgId: organization.id,
        userId,
        dataResidency: tenantScope.dataResidency,
        dataClassification: tenantScope.dataClassification,
        auditSource: 'accept-invitation',
        tenantScope,
    });
}
