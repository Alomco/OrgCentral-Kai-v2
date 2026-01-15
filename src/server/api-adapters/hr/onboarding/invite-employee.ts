import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { onboardingInviteSchema } from '@/server/types/hr-onboarding-schemas';
import { sendOnboardingInvite } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';
import { buildInvitationRequestSecurityContext } from '@/server/use-cases/shared/request-metadata';
import { readJson } from '@/server/api-adapters/http/request-utils';
import {
    resolveOnboardingControllerDependencies,
    type OnboardingControllerDependencies,
} from '@/server/services/hr/onboarding/onboarding-controller-dependencies';

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
        requiredPermissions: { member: ['invite'] },
        auditSource: 'api:hr:onboarding:invite',
        action: 'invite',
        resourceType: 'hr.onboarding',
        resourceAttributes: {
            email: payload.email,
            employeeNumber: payload.employeeNumber,
        },
    });

    const requestContext = buildInvitationRequestSecurityContext({
        authorization,
        headers: request.headers,
        action: 'hr.onboarding.invite',
        targetEmail: payload.email,
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
            request: requestContext,
        },
    );

    return { success: true, token: result.token };
}
