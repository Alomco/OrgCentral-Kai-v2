import type { GetSessionDependencies } from '@/server/use-cases/auth/sessions/get-session';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { PrismaOnboardingInvitationRepository } from '@/server/repositories/prisma/hr/onboarding/prisma-invitation-repository';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IOnboardingInvitationRepository } from '@/server/repositories/contracts/hr/onboarding/invitation-repository-contract';
import type { IOrganizationRepository } from '@/server/repositories/contracts/org/organization/organization-repository-contract';
import { onboardingInviteSchema } from '@/server/types/hr-onboarding-schemas';
import { sendOnboardingInvite } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';
import { readJson } from '@/server/api-adapters/http/request-utils';

export interface ResolvedOnboardingControllerDependencies {
    session: GetSessionDependencies;
    profileRepository: IEmployeeProfileRepository;
    invitationRepository: IOnboardingInvitationRepository;
    organizationRepository: IOrganizationRepository;
}

export type OnboardingControllerDependencies = Partial<ResolvedOnboardingControllerDependencies>;

const profileRepository = new PrismaEmployeeProfileRepository();
const invitationRepository = new PrismaOnboardingInvitationRepository();
const organizationRepository = new PrismaOrganizationRepository({});

export const defaultOnboardingControllerDependencies: ResolvedOnboardingControllerDependencies = {
    session: {},
    profileRepository,
    invitationRepository,
    organizationRepository,
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
        invitationRepository:
            overrides.invitationRepository ?? defaultOnboardingControllerDependencies.invitationRepository,
        organizationRepository:
            overrides.organizationRepository ?? defaultOnboardingControllerDependencies.organizationRepository,
    };
}

export interface InviteEmployeeControllerResult {
    success: true;
    token: string;
}

export async function inviteEmployeeController(
    request: Request,
    dependencies?: OnboardingControllerDependencies,
): Promise<InviteEmployeeControllerResult> {
    const payload = onboardingInviteSchema.parse(await readJson(request));
    const resolved = resolveOnboardingControllerDependencies(dependencies);

    const { authorization } = await getSessionContext(resolved.session, {
        headers: request.headers,
        requiredRoles: ['orgAdmin'],
        requiredPermissions: { member: ['invite'] },
        auditSource: 'api:hr:onboarding:invite',
        action: 'invite',
        resourceType: 'hr.onboarding',
        resourceAttributes: {
            email: payload.email,
            employeeNumber: payload.employeeNumber,
        },
    });

    const result = await sendOnboardingInvite(
        {
            profileRepository: resolved.profileRepository,
            invitationRepository: resolved.invitationRepository,
            organizationRepository: resolved.organizationRepository,
        },
        {
            authorization,
            email: payload.email,
            displayName: payload.displayName,
            employeeNumber: payload.employeeNumber,
            jobTitle: payload.jobTitle,
            employmentType: payload.employmentType,
            eligibleLeaveTypes: payload.eligibleLeaveTypes,
            onboardingTemplateId: payload.onboardingTemplateId,
            roles: payload.roles,
        },
    );

    return { success: true, token: result.token };
}
