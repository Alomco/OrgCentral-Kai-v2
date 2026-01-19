import { AuthorizationError, ValidationError } from '@/server/errors';
import { canManageOnboarding } from '@/server/security/authorization/hr-guards/onboarding';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IOnboardingInvitationRepository } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import type { IUserRepository } from '@/server/repositories/contracts/org/users/user-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { normalizeRoles } from '@/server/use-cases/shared';
import { buildMetadata } from '@/server/use-cases/shared/builders';
import { INVITATION_KIND, withInvitationKind } from '@/server/invitations/invitation-kinds';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import { checkExistingOnboardingTarget } from './check-existing-onboarding-target';

export interface SendOnboardingInviteInput {
    authorization: RepositoryAuthorizationContext;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    employeeNumber: string;
    jobTitle?: string;
    departmentId?: string;
    employmentType?: string;
    startDate?: string;
    managerEmployeeNumber?: string;
    annualSalary?: number;
    hourlyRate?: number;
    salaryCurrency?: string;
    salaryBasis?: string;
    paySchedule?: string;
    eligibleLeaveTypes?: string[];
    onboardingTemplateId?: string | null;
    roles?: string[];
    request?: {
        ipAddress?: string;
        userAgent?: string;
        securityContext?: Record<string, unknown>;
    };
}

export interface SendOnboardingInviteDependencies {
    profileRepository: IEmployeeProfileRepository;
    invitationRepository: IOnboardingInvitationRepository;
    organizationRepository?: IOrganizationRepository;
    userRepository?: IUserRepository;
}

export interface SendOnboardingInviteResult {
    token: string;
}

export async function sendOnboardingInvite(
    deps: SendOnboardingInviteDependencies,
    input: SendOnboardingInviteInput,
): Promise<SendOnboardingInviteResult> {
    if (!canManageOnboarding(input.authorization)) {
        throw new AuthorizationError('You do not have permission to invite employees.');
    }

    assertNonEmpty(input.email, 'email');
    assertNonEmpty(input.displayName, 'displayName');
    assertNonEmpty(input.employeeNumber, 'employeeNumber');

    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedEmployeeNumber = input.employeeNumber.trim();

    const existing = await checkExistingOnboardingTarget(
        {
            profileRepository: deps.profileRepository,
            invitationRepository: deps.invitationRepository,
            userRepository: deps.userRepository,
        },
        {
            authorization: input.authorization,
            email: normalizedEmail,
            employeeNumber: normalizedEmployeeNumber,
        },
    );

    if (existing.exists) {
        throw new ValidationError('An onboarding target with this email already exists.', existing);
    }

    const existingProfile = await deps.profileRepository.findByEmployeeNumber(
        input.authorization.orgId,
        normalizedEmployeeNumber,
    );
    if (existingProfile && !isPreboardingProfile(existingProfile)) {
        throw new ValidationError('An employee profile with this employee number already exists.', {
            kind: 'employee_number',
            profileId: existingProfile.id,
        });
    }

    const organization = await deps.organizationRepository?.getOrganization(input.authorization.orgId);

    const roles = normalizeRoles(input.roles ?? []);
    if (roles.length > 0 && roles[0] !== 'member') {
        throw new ValidationError('Onboarding invitations may only assign the member role.');
    }

    const invitation = await deps.invitationRepository.createInvitation({
        orgId: input.authorization.orgId,
        organizationName: organization?.name ?? input.authorization.orgId,
        targetEmail: normalizedEmail,
        invitedByUserId: input.authorization.userId,
        onboardingData: {
            email: normalizedEmail,
            displayName: input.displayName,
            firstName: input.firstName,
            lastName: input.lastName,
            employeeId: normalizedEmployeeNumber,
            employmentType: input.employmentType,
            position: input.jobTitle,
            departmentId: input.departmentId,
            startDate: input.startDate,
            managerEmployeeNumber: input.managerEmployeeNumber,
            annualSalary: input.annualSalary,
            hourlyRate: input.hourlyRate,
            salaryCurrency: input.salaryCurrency,
            salaryBasis: input.salaryBasis,
            paySchedule: input.paySchedule,
            eligibleLeaveTypes: input.eligibleLeaveTypes,
            onboardingTemplateId: input.onboardingTemplateId ?? undefined,
            roles: roles.length > 0 ? roles : ['member'],
        },
        metadata: withInvitationKind(
            buildMetadata({
                auditSource: input.authorization.auditSource,
                correlationId: input.authorization.correlationId,
                dataResidency: input.authorization.dataResidency,
                dataClassification: input.authorization.dataClassification,
            }),
            INVITATION_KIND.HR_ONBOARDING,
        ),
        securityContext: input.request?.securityContext
            ? buildMetadata(input.request.securityContext)
            : undefined,
        ipAddress: input.request?.ipAddress,
        userAgent: input.request?.userAgent,
    });

    return { token: invitation.token };
}

function isPreboardingProfile(profile: EmployeeProfileDTO): boolean {
    const metadata = profile.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return false;
    }
    return (metadata as Record<string, unknown>).preboarding === true;
}
