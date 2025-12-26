import { EntityNotFoundError } from '@/server/errors';
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
import { normalizeToken } from '@/server/use-cases/shared';
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

export interface CompleteOnboardingInviteInput {
    inviteToken: string;
    userId: string;
    actorEmail: string;
}

export interface CompleteOnboardingInviteDependencies {
    onboardingInvitationRepository: IOnboardingInvitationRepository;
    organizationRepository: IOrganizationRepository;
    employeeProfileRepository: IEmployeeProfileRepository;
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
    alreadyMember: false;
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

    const creationResult = await createEmployeeProfile(
        createProfileDependencies(deps),
        buildCreateProfileInput({
            authorization,
            profileData,
            contractData,
            onboardingTemplateId: payload.onboardingTemplateId,
            onboardingChecklist,
        }),
    );

    const profile = await deps.employeeProfileRepository.findByEmployeeNumber(organization.id, employeeNumber);
    if (!profile) {
        throw new EntityNotFoundError('Employee profile', { employeeNumber, orgId: organization.id });
    }

    await deps.employeeProfileRepository.linkProfileToUser(organization.id, employeeNumber, input.userId);
    await deps.onboardingInvitationRepository.markAccepted(organization.id, invitation.token, input.userId);

    return {
        success: true,
        organizationId: organization.id,
        organizationName: organization.name,
        employeeNumber,
        profileId: profile.id,
        roles: resolveRoles(payload.roles),
        alreadyMember: false,
        contractCreated: creationResult.contractCreated,
        checklistInstanceId: creationResult.checklistInstanceId,
    } satisfies CompleteOnboardingInviteResult;
}

const INVITATION_RESOURCE = 'Onboarding invitation';
