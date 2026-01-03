'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { getPeopleOrchestrationService } from '@/server/services/hr/people/people-orchestration.provider';

import type { LifecycleActionState } from './lifecycle-types';

const eligibilitySchema = z.object({
    profileId: z.uuid(),
    year: z.coerce.number().int().min(2000).max(2100),
    eligibleLeaveTypes: z.array(z.string().min(1)),
});

const terminationSchema = z.object({
    profileId: z.uuid(),
    contractId: z.uuid().optional(),
    terminationDate: z.coerce.date(),
    terminationReason: z.string().min(1).max(500),
    cancelPendingLeave: z.boolean().optional(),
    closeAbsences: z.boolean().optional(),
});

const complianceSchema = z.object({
    profileId: z.uuid(),
    userId: z.uuid(),
    templateId: z.uuid(),
    templateItemIds: z.array(z.string().min(1)).min(1),
});

const DEFAULT_ERROR_MESSAGE = 'Check the highlighted fields and try again.';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function readFormArray(formData: FormData, key: string): string[] {
    return formData
        .getAll(key)
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

function readFormCheckbox(formData: FormData, key: string): boolean {
    return formData.get(key) === 'on';
}

export async function updateEligibilityAction(
    _previous: LifecycleActionState,
    formData: FormData,
): Promise<LifecycleActionState> {
    const parsed = eligibilitySchema.safeParse({
        profileId: readFormString(formData, 'profileId'),
        year: readFormString(formData, 'year'),
        eligibleLeaveTypes: readFormArray(formData, 'eligibleLeaveTypes'),
    });

    if (!parsed.success) {
        return { status: 'error', message: DEFAULT_ERROR_MESSAGE };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: {
                employeeProfile: ['update'],
                hrLeaveBalance: ['adjust'],
            },
            auditSource: 'ui:hr:employees:lifecycle:eligibility',
            action: HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
            resourceAttributes: { profileId: parsed.data.profileId },
        });
    } catch {
        return { status: 'error', message: 'Not authorized to update leave eligibility.' };
    }

    try {
        const orchestration = getPeopleOrchestrationService();
        await orchestration.updateEligibility({
            authorization: session.authorization,
            profileId: parsed.data.profileId,
            eligibleLeaveTypes: parsed.data.eligibleLeaveTypes,
            year: parsed.data.year,
        });

        revalidatePath('/hr/employees');
        revalidatePath(`/hr/employees/${parsed.data.profileId}`);

        return { status: 'success', message: 'Leave eligibility updated.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update leave eligibility.',
        };
    }
}

export async function terminateEmployeeAction(
    _previous: LifecycleActionState,
    formData: FormData,
): Promise<LifecycleActionState> {
    const contractIdRaw = readFormString(formData, 'contractId');
    const parsed = terminationSchema.safeParse({
        profileId: readFormString(formData, 'profileId'),
        contractId: contractIdRaw.length > 0 ? contractIdRaw : undefined,
        terminationDate: readFormString(formData, 'terminationDate'),
        terminationReason: readFormString(formData, 'terminationReason'),
        cancelPendingLeave: readFormCheckbox(formData, 'cancelPendingLeave'),
        closeAbsences: readFormCheckbox(formData, 'closeAbsences'),
    });

    if (!parsed.success) {
        return { status: 'error', message: DEFAULT_ERROR_MESSAGE };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: {
                employeeProfile: ['update'],
                employmentContract: ['update'],
            },
            auditSource: 'ui:hr:employees:lifecycle:termination',
            action: HR_ACTION.UPDATE,
            resourceType: HR_RESOURCE.HR_EMPLOYEE_PROFILE,
            resourceAttributes: { profileId: parsed.data.profileId },
        });
    } catch {
        return { status: 'error', message: 'Not authorized to terminate this employee.' };
    }

    try {
        const orchestration = getPeopleOrchestrationService();
        await orchestration.terminateEmployee({
            authorization: session.authorization,
            profileId: parsed.data.profileId,
            contractId: parsed.data.contractId,
            termination: {
                reason: parsed.data.terminationReason,
                date: parsed.data.terminationDate,
            },
            cancelPendingLeave: parsed.data.cancelPendingLeave,
            closeAbsences: parsed.data.closeAbsences,
        });

        revalidatePath('/hr/employees');
        revalidatePath(`/hr/employees/${parsed.data.profileId}`);

        return { status: 'success', message: 'Employee termination saved.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to terminate employee.',
        };
    }
}

export async function assignCompliancePackAction(
    _previous: LifecycleActionState,
    formData: FormData,
): Promise<LifecycleActionState> {
    const parsed = complianceSchema.safeParse({
        profileId: readFormString(formData, 'profileId'),
        userId: readFormString(formData, 'userId'),
        templateId: readFormString(formData, 'templateId'),
        templateItemIds: readFormArray(formData, 'templateItemIds'),
    });

    if (!parsed.success) {
        return { status: 'error', message: DEFAULT_ERROR_MESSAGE };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { hrCompliance: ['assign'] },
            auditSource: 'ui:hr:employees:lifecycle:compliance',
            action: HR_ACTION.ASSIGN,
            resourceType: HR_RESOURCE.HR_COMPLIANCE,
            resourceAttributes: { userId: parsed.data.userId, templateId: parsed.data.templateId },
        });
    } catch {
        return { status: 'error', message: 'Not authorized to assign compliance packs.' };
    }

    try {
        const orchestration = getPeopleOrchestrationService();
        await orchestration.assignCompliancePack({
            authorization: session.authorization,
            userIds: [parsed.data.userId],
            templateId: parsed.data.templateId,
            templateItemIds: parsed.data.templateItemIds,
        });

        revalidatePath('/hr/compliance');
        revalidatePath(`/hr/employees/${parsed.data.profileId}`);

        return { status: 'success', message: 'Compliance pack assigned.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to assign compliance pack.',
        };
    }
}
