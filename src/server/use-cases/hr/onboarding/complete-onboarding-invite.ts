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
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IMembershipRepository, EmployeeProfilePayload, UserActivationPayload } from '@/server/repositories/contracts/org/membership';
import type { BillingServiceContract } from '@/server/services/billing/billing-service.provider';
import { MembershipStatus } from '@prisma/client';
import { normalizeToken, parseDate } from '@/server/use-cases/shared';
import {
    createEmployeeProfile,
    type CreateEmployeeProfileTransactionRunner,
} from '@/server/use-cases/hr/people/create-employee-profile';
import { createEmploymentContract } from '@/server/use-cases/hr/people/employment/create-employment-contract';
import { getEmploymentContractByEmployee } from '@/server/use-cases/hr/people/employment/get-employment-contract-by-employee';
import { instantiateOnboardingChecklist } from '@/server/use-cases/hr/people/create-employee-profile.helpers';
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

    const creationResult = existingProfile
        ? await handleExistingProfile({
            deps,
            authorization,
            employeeNumber,
            contractData,
            onboardingChecklist,
            existingProfile,
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

    const profile = existingProfile ?? await deps.employeeProfileRepository.findByEmployeeNumber(organization.id, employeeNumber);
    if (!profile) {
        throw new EntityNotFoundError('Employee profile', { employeeNumber, orgId: organization.id });
    }

    await deps.employeeProfileRepository.linkProfileToUser(organization.id, employeeNumber, input.userId);

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

async function handleExistingProfile(params: {
    deps: CompleteOnboardingInviteDependencies;
    authorization: RepositoryAuthorizationContext;
    employeeNumber: string;
    contractData: ReturnType<typeof buildContractData>;
    onboardingChecklist: ReturnType<typeof buildChecklistConfig>;
    existingProfile: NonNullable<Awaited<ReturnType<IEmployeeProfileRepository['findByEmployeeNumber']>>>;
}): Promise<{ contractCreated?: boolean; checklistInstanceId?: string }> {
    const { deps, authorization, employeeNumber, contractData, onboardingChecklist, existingProfile } = params;

    const canCreateContract = existingProfile.userId === authorization.userId;

    let contractCreated = false;
    if (contractData && canCreateContract) {
        if (!deps.employmentContractRepository) {
            throw new Error('Employment contract repository is required when contract data is provided.');
        }
        const contractResult = await getEmploymentContractByEmployee(
            { employmentContractRepository: deps.employmentContractRepository },
            { authorization, employeeId: existingProfile.userId },
        );
        if (!contractResult.contract) {
            await createEmploymentContract(
                { employmentContractRepository: deps.employmentContractRepository },
                { authorization, contractData },
            );
            contractCreated = true;
        }
    }

    let checklistInstanceId: string | undefined;
    if (onboardingChecklist) {
        checklistInstanceId = await instantiateOnboardingChecklist({
            dependencies: createProfileDependencies(deps),
            authorization,
            onboardingChecklist,
            employeeIdentifier: employeeNumber,
        });
    }

    return {
        contractCreated: contractCreated || undefined,
        checklistInstanceId,
    };
}

async function ensureMembership(params: {
    authorization: RepositoryAuthorizationContext;
    membershipRepository: IMembershipRepository;
    billingService?: BillingServiceContract;
    invitation: { invitedByUserId?: string | null; targetEmail: string };
    payload: { displayName?: string; email?: string; roles?: string[] };
    profile: {
        jobTitle?: string | null;
        employmentType: EmployeeProfilePayload['employmentType'];
        startDate?: Date | string | null;
        metadata?: EmployeeProfilePayload['metadata'];
    };
    userId: string;
    employeeNumber: string;
}): Promise<{ alreadyMember: boolean }> {
    const existing = await params.membershipRepository.findMembership(params.authorization, params.userId);
    if (existing) {
        return { alreadyMember: true };
    }

    const userUpdate = buildUserActivationPayload(params.payload, params.invitation.targetEmail);
    const profilePayload: EmployeeProfilePayload = {
        orgId: params.authorization.orgId,
        userId: params.userId,
        employeeNumber: params.employeeNumber,
        jobTitle: params.profile.jobTitle,
        employmentType: params.profile.employmentType,
        startDate: parseDate(params.profile.startDate ?? undefined) ?? null,
        metadata: params.profile.metadata ?? null,
    };

    await params.membershipRepository.createMembershipWithProfile(params.authorization, {
        userId: params.userId,
        invitedByUserId: params.invitation.invitedByUserId ?? undefined,
        roles: resolveRoles(params.payload.roles),
        profile: profilePayload,
        userUpdate,
    });

    await params.billingService?.syncSeats({ authorization: params.authorization });
    return { alreadyMember: false };
}

function buildUserActivationPayload(
    payload: { displayName?: string; email?: string },
    fallbackEmail: string,
): UserActivationPayload {
    const email = payload.email?.trim() ?? fallbackEmail;
    const displayName = payload.displayName?.trim() ?? email;
    return {
        displayName,
        email,
        status: MembershipStatus.ACTIVE,
    };
}
