import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_INVITATIONS } from '@/server/repositories/cache-scopes';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import { sendOnboardingInvite, type SendOnboardingInviteDependencies } from '@/server/use-cases/hr/onboarding/send-onboarding-invite';
import { buildInvitationRequestSecurityContext } from '@/server/use-cases/shared/request-metadata';
import { getHrSettingsForUi } from '@/server/use-cases/hr/settings/get-hr-settings.cached';
import { buildLeaveTypeCodeSet, normalizeLeaveTypeOptions } from '@/server/lib/hr/leave-type-options';
import type { OnboardingWizardValues } from './wizard.schema';
import type { WizardSubmitResult } from './wizard.types';
import { attemptInvitationEmail } from './wizard.email';

interface WizardInviteContext {
    authorization: RepositoryAuthorizationContext;
    headerStore: Headers;
    values: OnboardingWizardValues;
}

export async function validateLeaveTypeSelections(
    authorization: RepositoryAuthorizationContext,
    eligibleLeaveTypes: string[] | null | undefined,
): Promise<string | null> {
    if (!eligibleLeaveTypes || eligibleLeaveTypes.length === 0) {
        return null;
    }
    try {
        const hrSettingsResult = await getHrSettingsForUi({
            authorization,
            orgId: authorization.orgId,
        });
        const leaveTypeOptions = normalizeLeaveTypeOptions(hrSettingsResult.settings.leaveTypes ?? undefined);
        const allowedCodes = buildLeaveTypeCodeSet(leaveTypeOptions);
        const invalidSelections = eligibleLeaveTypes
            .map((code) => code.trim())
            .filter((code) => code.length > 0 && !allowedCodes.has(code));

        if (invalidSelections.length > 0) {
            return 'Selected leave types are no longer available. Please update your selections.';
        }
        return null;
    } catch {
        return 'Unable to validate leave type selections. Please try again.';
    }
}

export async function sendOnboardingWizardInvite(
    context: WizardInviteContext,
    dependencies: SendOnboardingInviteDependencies,
): Promise<WizardSubmitResult> {
    const employeeNumber = context.values.employeeNumber?.trim() ?? '';
    if (!employeeNumber) {
        return {
            success: false,
            error: 'Employee number is required for onboarding invitations.',
        };
    }

    const onboardingTemplateId = context.values.includeTemplate
        ? (context.values.onboardingTemplateId ?? null)
        : null;

    const requestContext = buildInvitationRequestSecurityContext({
        authorization: context.authorization,
        headers: context.headerStore,
        action: 'hr.onboarding.wizard.invite',
        targetEmail: context.values.email,
    });

    const result = await sendOnboardingInvite(
        dependencies,
        {
            authorization: context.authorization,
            email: context.values.email,
            displayName: context.values.displayName,
            firstName: context.values.firstName,
            lastName: context.values.lastName,
            employeeNumber,
            jobTitle: context.values.jobTitle,
            departmentId: context.values.departmentId,
            employmentType: context.values.employmentType,
            startDate: context.values.startDate,
            managerEmployeeNumber: context.values.managerEmployeeNumber,
            annualSalary: context.values.annualSalary,
            hourlyRate: context.values.hourlyRate,
            salaryCurrency: context.values.currency,
            salaryBasis: context.values.salaryBasis,
            paySchedule: context.values.paySchedule,
            eligibleLeaveTypes: context.values.eligibleLeaveTypes ?? [],
            onboardingTemplateId,
            mentorEmployeeNumber: context.values.mentorEmployeeNumber,
            workflowTemplateId: context.values.workflowTemplateId,
            emailSequenceTemplateId: context.values.emailSequenceTemplateId,
            documentTemplateIds: context.values.documentTemplateIds ?? [],
            provisioningTaskTypes: context.values.provisioningTaskTypes ?? [],
            roles: [context.values.role],
            request: requestContext,
        },
    );

    const emailResult = await attemptInvitationEmail(context.authorization, result.token);
    const message = emailResult.delivered
        ? 'Invitation created. Email sent.'
        : `Invitation created, but email delivery failed. ${emailResult.failureMessage ?? 'Invitation email delivery failed.'} Share the invite link manually.`;

    await invalidateOrgCache(
        context.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_INVITATIONS,
        context.authorization.dataClassification,
        context.authorization.dataResidency,
    );

    return {
        success: true,
        token: result.token,
        invitationUrl: emailResult.invitationUrl,
        emailDelivered: emailResult.delivered,
        message,
    };
}

export async function sendMembershipWizardInvite(
    context: WizardInviteContext,
): Promise<WizardSubmitResult> {
    const requestContext = buildInvitationRequestSecurityContext({
        authorization: context.authorization,
        headers: context.headerStore,
        action: 'org.invitation.create',
        targetEmail: context.values.email,
    });

    const membershipService = getMembershipService();
    const result = await membershipService.inviteMember({
        authorization: context.authorization,
        email: context.values.email,
        roles: [context.values.role],
        request: requestContext,
    });

    if (result.alreadyInvited) {
        return {
            success: true,
            token: result.token,
            emailDelivered: true,
            message: 'An active invitation already exists for this email.',
        };
    }

    const emailResult = await attemptInvitationEmail(context.authorization, result.token);
    const message = emailResult.delivered
        ? 'Invitation created. Email sent.'
        : `Invitation created, but email delivery failed. ${emailResult.failureMessage ?? 'Invitation email delivery failed.'} Share the invite link manually.`;

    return {
        success: true,
        token: result.token,
        invitationUrl: emailResult.invitationUrl,
        emailDelivered: emailResult.delivered,
        message,
    };
}
