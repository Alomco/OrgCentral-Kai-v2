import { resolveBillingService } from '@/server/services/billing/billing-service.provider';
import { buildOnboardingServiceDependencies } from '@/server/repositories/providers/hr/onboarding-service-dependencies';
import { buildPeopleServiceDependencies } from '@/server/repositories/providers/hr/people-service-dependencies';
import { buildMembershipRepositoryDependencies } from '@/server/repositories/providers/org/membership-service-dependencies';
import { buildOrganizationServiceDependencies } from '@/server/repositories/providers/org/organization-service-dependencies';
import { buildUserServiceDependencies } from '@/server/repositories/providers/org/user-service-dependencies';
import type { GetSessionDependencies } from '@/server/use-cases/auth/sessions/get-session';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IOnboardingInvitationRepository } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { CompleteOnboardingInviteDependencies } from '@/server/use-cases/hr/onboarding/complete-onboarding-invite';
import {
    PrismaMentorAssignmentRepository,
    PrismaProvisioningTaskRepository,
    PrismaOnboardingWorkflowTemplateRepository,
    PrismaOnboardingWorkflowRunRepository,
    PrismaEmailSequenceTemplateRepository,
    PrismaEmailSequenceEnrollmentRepository,
    PrismaEmailSequenceDeliveryRepository,
    PrismaOnboardingMetricDefinitionRepository,
    PrismaOnboardingMetricResultRepository,
    PrismaDocumentTemplateAssignmentRepository,
} from '@/server/repositories/prisma/hr/onboarding';
import { PrismaDocumentTemplateRepository } from '@/server/repositories/prisma/records/documents';

const { profileRepo: profileRepository, contractRepo: employmentContractRepository } = buildPeopleServiceDependencies();
const {
    checklistTemplateRepository,
    checklistInstanceRepository,
    onboardingInvitationRepository: invitationRepository,
} = buildOnboardingServiceDependencies();
const { organizationRepository } = buildOrganizationServiceDependencies();
const { userRepository } = buildUserServiceDependencies();
const { membershipRepository } = buildMembershipRepositoryDependencies();
const billingService = resolveBillingService() ?? undefined;
const mentorAssignmentRepository = new PrismaMentorAssignmentRepository();
const provisioningTaskRepository = new PrismaProvisioningTaskRepository();
const workflowTemplateRepository = new PrismaOnboardingWorkflowTemplateRepository();
const workflowRunRepository = new PrismaOnboardingWorkflowRunRepository();
const emailSequenceTemplateRepository = new PrismaEmailSequenceTemplateRepository();
const emailSequenceEnrollmentRepository = new PrismaEmailSequenceEnrollmentRepository();
const emailSequenceDeliveryRepository = new PrismaEmailSequenceDeliveryRepository();
const onboardingMetricDefinitionRepository = new PrismaOnboardingMetricDefinitionRepository();
const onboardingMetricResultRepository = new PrismaOnboardingMetricResultRepository();
const documentTemplateAssignmentRepository = new PrismaDocumentTemplateAssignmentRepository();
const documentTemplateRepository = new PrismaDocumentTemplateRepository();

export interface ResolvedOnboardingControllerDependencies {
    session: GetSessionDependencies;
    profileRepository: IEmployeeProfileRepository;
    invitationRepository: IOnboardingInvitationRepository;
    organizationRepository: IOrganizationRepository;
    userRepository: IUserRepository;
}

export type OnboardingControllerDependencies = Partial<ResolvedOnboardingControllerDependencies>;

export const defaultOnboardingControllerDependencies: ResolvedOnboardingControllerDependencies = {
    session: {},
    profileRepository,
    invitationRepository,
    organizationRepository,
    userRepository,
};

export function resolveOnboardingControllerDependencies(
    overrides?: OnboardingControllerDependencies,
): ResolvedOnboardingControllerDependencies {
    if (!overrides) {
        return defaultOnboardingControllerDependencies;
    }

    return {
        session: overrides.session ?? defaultOnboardingControllerDependencies.session,
        profileRepository: overrides.profileRepository ?? defaultOnboardingControllerDependencies.profileRepository,
        invitationRepository: overrides.invitationRepository ?? defaultOnboardingControllerDependencies.invitationRepository,
        organizationRepository: overrides.organizationRepository ?? defaultOnboardingControllerDependencies.organizationRepository,
        userRepository: overrides.userRepository ?? defaultOnboardingControllerDependencies.userRepository,
    };
}

export function getChecklistInstanceRepository() {
    return checklistInstanceRepository;
}

export function getChecklistTemplateRepository() {
    return checklistTemplateRepository;
}

export function getOnboardingInvitationRepository() {
    return invitationRepository;
}

export function getCompleteOnboardingInviteDependencies(): CompleteOnboardingInviteDependencies {
    return {
        onboardingInvitationRepository: invitationRepository,
        organizationRepository,
        employeeProfileRepository: profileRepository,
        membershipRepository,
        billingService,
        employmentContractRepository,
        checklistTemplateRepository,
        checklistInstanceRepository,
        mentorAssignmentRepository,
        provisioningTaskRepository,
        workflowTemplateRepository,
        workflowRunRepository,
        emailSequenceTemplateRepository,
        emailSequenceEnrollmentRepository,
        emailSequenceDeliveryRepository,
        documentTemplateAssignmentRepository,
        documentTemplateRepository,
        onboardingMetricDefinitionRepository,
        onboardingMetricResultRepository,
    };
}
