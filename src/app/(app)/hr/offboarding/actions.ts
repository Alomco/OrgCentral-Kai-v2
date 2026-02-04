'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { PrismaOffboardingRepository } from '@/server/repositories/prisma/hr/offboarding';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import {
    PrismaChecklistTemplateRepository,
    PrismaChecklistInstanceRepository,
    PrismaProvisioningTaskRepository,
    PrismaOnboardingWorkflowTemplateRepository,
    PrismaOnboardingWorkflowRunRepository,
    PrismaEmailSequenceTemplateRepository,
    PrismaEmailSequenceEnrollmentRepository,
    PrismaEmailSequenceDeliveryRepository,
    PrismaOnboardingMetricDefinitionRepository,
    PrismaOnboardingMetricResultRepository,
} from '@/server/repositories/prisma/hr/onboarding';
import { createUserSessionRepository } from '@/server/repositories/providers/auth/user-session-repository-provider';
import { getMembershipService } from '@/server/services/org/membership/membership-service.provider';
import {
    startOffboarding,
    completeOffboarding,
    cancelOffboarding,
} from '@/server/use-cases/hr/offboarding';

import type { OffboardingMode } from '@/server/use-cases/hr/offboarding/start-offboarding';

export interface OffboardingActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

const startSchema = z.object({
    profileId: z.uuid(),
    mode: z.enum(['DIRECT', 'CHECKLIST']),
    templateId: z.uuid().optional(),
    reason: z.string().min(1).max(500),
});

const completeSchema = z.object({
    offboardingId: z.uuid(),
});

const cancelSchema = z.object({
    offboardingId: z.uuid(),
    reason: z.string().max(500).optional(),
});

const EMPLOYEES_PATH = '/hr/employees';
const OFFBOARDING_PATH = '/hr/offboarding';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

export async function startOffboardingAction(
    _previous: OffboardingActionState,
    formData: FormData,
): Promise<OffboardingActionState> {
    const parsed = startSchema.safeParse({
        profileId: readFormString(formData, 'profileId'),
        mode: readFormString(formData, 'mode') as OffboardingMode,
        templateId: readFormString(formData, 'templateId') || undefined,
        reason: readFormString(formData, 'reason'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Check the form fields and try again.' };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { [HR_RESOURCE.HR_OFFBOARDING]: ['create'] },
            auditSource: 'ui:hr:offboarding:start',
            action: HR_ACTION.CREATE,
            resourceType: HR_RESOURCE.HR_OFFBOARDING,
            resourceAttributes: { profileId: parsed.data.profileId, mode: parsed.data.mode },
        });
    } catch {
        return { status: 'error', message: 'Not authorized to start offboarding.' };
    }

    try {
        const offboardingRepository = new PrismaOffboardingRepository();
        const employeeProfileRepository = new PrismaEmployeeProfileRepository();
        const checklistTemplateRepository = new PrismaChecklistTemplateRepository();
        const checklistInstanceRepository = new PrismaChecklistInstanceRepository();
        const provisioningTaskRepository = new PrismaProvisioningTaskRepository();
        const workflowTemplateRepository = new PrismaOnboardingWorkflowTemplateRepository();
        const workflowRunRepository = new PrismaOnboardingWorkflowRunRepository();
        const emailSequenceTemplateRepository = new PrismaEmailSequenceTemplateRepository();
        const emailSequenceEnrollmentRepository = new PrismaEmailSequenceEnrollmentRepository();
        const emailSequenceDeliveryRepository = new PrismaEmailSequenceDeliveryRepository();
        const onboardingMetricDefinitionRepository = new PrismaOnboardingMetricDefinitionRepository();
        const onboardingMetricResultRepository = new PrismaOnboardingMetricResultRepository();
        const userSessionRepository = createUserSessionRepository();
        const membershipService = getMembershipService();

        await startOffboarding(
            {
                offboardingRepository,
                employeeProfileRepository,
                checklistTemplateRepository,
                checklistInstanceRepository,
                provisioningTaskRepository,
                workflowTemplateRepository,
                workflowRunRepository,
                emailSequenceTemplateRepository,
                emailSequenceEnrollmentRepository,
                emailSequenceDeliveryRepository,
                onboardingMetricDefinitionRepository,
                onboardingMetricResultRepository,
                userSessionRepository,
                membershipService,
            },
            {
                authorization: session.authorization,
                profileId: parsed.data.profileId,
                mode: parsed.data.mode,
                templateId: parsed.data.templateId,
                reason: parsed.data.reason,
            },
        );

        revalidatePath(EMPLOYEES_PATH);
        revalidatePath(`/hr/employees/${parsed.data.profileId}`);
        revalidatePath(OFFBOARDING_PATH);

        return { status: 'success', message: 'Offboarding started.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to start offboarding.',
        };
    }
}

export async function completeOffboardingAction(
    _previous: OffboardingActionState,
    formData: FormData,
): Promise<OffboardingActionState> {
    const parsed = completeSchema.safeParse({
        offboardingId: readFormString(formData, 'offboardingId'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid request.' };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { [HR_RESOURCE.HR_OFFBOARDING]: ['complete'] },
            auditSource: 'ui:hr:offboarding:complete',
            action: HR_ACTION.COMPLETE,
            resourceType: HR_RESOURCE.HR_OFFBOARDING,
            resourceAttributes: { offboardingId: parsed.data.offboardingId },
        });
    } catch {
        return { status: 'error', message: 'Not authorized to complete offboarding.' };
    }

    try {
        const offboardingRepository = new PrismaOffboardingRepository();
        const employeeProfileRepository = new PrismaEmployeeProfileRepository();
        const checklistInstanceRepository = new PrismaChecklistInstanceRepository();
        const userSessionRepository = createUserSessionRepository();
        const membershipService = getMembershipService();

        await completeOffboarding(
            {
                offboardingRepository,
                employeeProfileRepository,
                checklistInstanceRepository,
                userSessionRepository,
                membershipService,
            },
            {
                authorization: session.authorization,
                offboardingId: parsed.data.offboardingId,
            },
        );

        revalidatePath(OFFBOARDING_PATH);
        revalidatePath(EMPLOYEES_PATH);

        return { status: 'success', message: 'Offboarding completed.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to complete offboarding.',
        };
    }
}

export async function cancelOffboardingAction(
    _previous: OffboardingActionState,
    formData: FormData,
): Promise<OffboardingActionState> {
    const parsed = cancelSchema.safeParse({
        offboardingId: readFormString(formData, 'offboardingId'),
        reason: readFormString(formData, 'reason') || undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid request.' };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { [HR_RESOURCE.HR_OFFBOARDING]: ['cancel'] },
            auditSource: 'ui:hr:offboarding:cancel',
            action: HR_ACTION.CANCEL,
            resourceType: HR_RESOURCE.HR_OFFBOARDING,
            resourceAttributes: { offboardingId: parsed.data.offboardingId },
        });
    } catch {
        return { status: 'error', message: 'Not authorized to cancel offboarding.' };
    }

    try {
        const offboardingRepository = new PrismaOffboardingRepository();
        const employeeProfileRepository = new PrismaEmployeeProfileRepository();

        await cancelOffboarding(
            { offboardingRepository, employeeProfileRepository },
            {
                authorization: session.authorization,
                offboardingId: parsed.data.offboardingId,
                reason: parsed.data.reason,
            },
        );

        revalidatePath(OFFBOARDING_PATH);
        revalidatePath(EMPLOYEES_PATH);

        return { status: 'success', message: 'Offboarding cancelled.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to cancel offboarding.',
        };
    }
}
