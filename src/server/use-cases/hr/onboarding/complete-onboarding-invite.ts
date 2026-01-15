import { EntityNotFoundError, ValidationError } from '@/server/errors';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import type {
    IChecklistInstanceRepository,
} from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type {
    IChecklistTemplateRepository,
} from '@/server/repositories/contracts/hr/onboarding/checklist-template-repository-contract';
import type {
    IOnboardingInvitationRepository,
} from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IMembershipRepository } from '@/server/repositories/contracts/org/membership';
import type { BillingServiceContract } from '@/server/services/billing/billing-service.provider';
import { normalizeToken } from '@/server/use-cases/shared';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import {
    createEmployeeProfile,
    type CreateEmployeeProfileTransactionRunner,
} from '@/server/use-cases/hr/people/create-employee-profile';
import {
    buildAuthorizationForInvite,
    buildChecklistConfig,
    buildContractData,
    buildCreateProfileInput,
    buildProfileData,
    createProfileDependencies,
    extractOnboardingPayload,
    resolveEmployeeNumber,
    resolveRoles,
    validateInvitation,
} from './complete-onboarding-invite.helpers';
import {
    ensureMembership,
    handleExistingProfile,
    linkProfileIfNeeded,
} from './complete-onboarding-invite.flow';

export interface CompleteOnboardingInviteInput {
    inviteToken: string;
    userId: string;
    actorEmail: string;
    request?: {
        ipAddress?: string;
        userAgent?: string;
    };
}

export interface CompleteOnboardingInviteDependencies {
    onboardingInvitationRepository: IOnboardingInvitationRepository;
    organizationRepository: IOrganizationRepository;
    employeeProfileRepository: IEmployeeProfileRepository;
    membershipRepository: IMembershipRepository;
    billingService?: BillingServiceContract;
    employmentContractRepository?: IEmploymentContractRepository;
    checklistTemplateRepository?: IChecklistTemplateRepository;
    checklistInstanceRepository?: IChecklistInstanceRepository;
    transactionRunner?: CreateEmployeeProfileTransactionRunner;
}

export interface CompleteOnboardingInviteResult {
    success: true;
    organizationId: string;
    organizationName: string;
    employeeNumber: string;
    profileId: string;
    roles: string[];
    alreadyMember: boolean;
    contractCreated?: boolean;
    checklistInstanceId?: string;
}

export async function completeOnboardingInvite(
    deps: CompleteOnboardingInviteDependencies,
    input: CompleteOnboardingInviteInput,
): Promise<CompleteOnboardingInviteResult> {
    const token = normalizeToken(input.inviteToken);
    const invitation = await deps.onboardingInvitationRepository.getInvitationByToken(token);
    if (!invitation) {
        throw new EntityNotFoundError(INVITATION_RESOURCE, { token });
    }

    validateInvitation(invitation, input.actorEmail, INVITATION_RESOURCE);

    const organization = await deps.organizationRepository.getOrganization(invitation.orgId);
    if (!organization) {
        throw new EntityNotFoundError('Organization', { orgId: invitation.orgId });
    }

    const authorization = buildAuthorizationForInvite(organization, input.userId);
    const payload = extractOnboardingPayload(invitation);
    const employeeNumber = resolveEmployeeNumber(payload);

    const profileData = buildProfileData({
        payload,
        userId: input.userId,
        employeeNumber,
        invitation,
    });

    const contractData = buildContractData(payload, input.userId);
    const onboardingChecklist = buildChecklistConfig(payload, invitation.token);

    const existingProfile = await deps.employeeProfileRepository.findByEmployeeNumber(
        organization.id,
        employeeNumber,
    );

    if (existingProfile && existingProfile.userId !== input.userId && !canLinkExistingProfile(existingProfile, invitation.targetEmail)) {
        throw new ValidationError('Employee number is already assigned to another profile.', {
            employeeNumber,
            profileId: existingProfile.id,
        });
    }

    const linkedProfile = existingProfile
        ? await linkProfileIfNeeded({
            repository: deps.employeeProfileRepository,
            orgId: organization.id,
            profile: existingProfile,
            userId: input.userId,
        })
        : null;

    const creationResult = linkedProfile
        ? await handleExistingProfile({
            deps,
            authorization,
            employeeNumber,
            contractData,
            onboardingChecklist,
            existingProfile: linkedProfile,
        })
        : await createEmployeeProfile(
            createProfileDependencies(deps),
            buildCreateProfileInput({
                authorization,
                profileData,
                contractData,
                onboardingTemplateId: payload.onboardingTemplateId,
                onboardingChecklist,
            }),
        );

    const profile = linkedProfile ?? await deps.employeeProfileRepository.findByEmployeeNumber(organization.id, employeeNumber);
    if (!profile) {
        throw new EntityNotFoundError('Employee profile', { employeeNumber, orgId: organization.id });
    }

    const membershipResult = await ensureMembership({
        authorization,
        membershipRepository: deps.membershipRepository,
        billingService: deps.billingService,
        invitation,
        payload,
        profile,
        userId: input.userId,
        employeeNumber,
    });

    await deps.onboardingInvitationRepository.markAccepted(organization.id, invitation.token, input.userId);

    await recordAuditEvent({
        orgId: organization.id,
        userId: input.userId,
        eventType: 'AUTH',
        action: 'hr.onboarding.invitation.accepted',
        resource: 'hr.onboarding.invitation',
        resourceId: organization.id,
        residencyZone: organization.dataResidency,
        classification: organization.dataClassification,
        auditSource: authorization.auditSource,
        payload: {
            alreadyMember: membershipResult.alreadyMember,
            contractCreated: Boolean(creationResult.contractCreated),
            checklistCreated: Boolean(creationResult.checklistInstanceId),
            ipAddress: input.request?.ipAddress,
            userAgent: input.request?.userAgent,
        },
    });

    return {
        success: true,
        organizationId: organization.id,
        organizationName: organization.name,
        employeeNumber,
        profileId: profile.id,
        roles: resolveRoles(payload.roles),
        alreadyMember: membershipResult.alreadyMember,
        contractCreated: creationResult.contractCreated,
        checklistInstanceId: creationResult.checklistInstanceId,
    } satisfies CompleteOnboardingInviteResult;
}

const INVITATION_RESOURCE = 'Onboarding invitation';

function canLinkExistingProfile(profile: Awaited<ReturnType<IEmployeeProfileRepository['findByEmployeeNumber']>>, targetEmail: string): boolean {
    if (!profile) {
        return false;
    }

    const normalizedTarget = targetEmail.trim().toLowerCase();
    const matchesEmail = [profile.email, profile.personalEmail]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .some((value) => value.trim().toLowerCase() === normalizedTarget);

    if (matchesEmail) {
        return true;
    }

    const metadata = profile.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return false;
    }
    return (metadata as Record<string, unknown>).preboarding === true;
}
