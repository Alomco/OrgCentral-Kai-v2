'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { LEAVE_POLICY_TYPES } from '@/server/types/leave-types';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    PrismaLeaveBalanceRepository,
    PrismaLeavePolicyRepository,
    PrismaLeaveRequestRepository,
} from '@/server/repositories/prisma/hr/leave';
import { createLeavePolicy } from '@/server/use-cases/hr/leave-policies/create-leave-policy';
import {
    updateLeavePolicy,
    updateLeavePolicyPatchSchema,
} from '@/server/use-cases/hr/leave-policies/update-leave-policy';
import { deleteLeavePolicy } from '@/server/use-cases/hr/leave-policies/delete-leave-policy';
import { toFieldErrors } from '../_components/form-errors';
import {
    createLeavePolicySchema,
    defaultCreateValues,
    readFormBoolean,
    readFormString,
    readOptionalNullableValue,
    readOptionalValue,
    updateLeavePolicySchema,
    type LeavePolicyCreateState,
    type LeavePolicyInlineState,
} from './leave-policy-form-utils';

export type { LeavePolicyCreateState, LeavePolicyInlineState, LeavePolicyCreateValues } from './leave-policy-form-utils';

const leavePolicyRepository = new PrismaLeavePolicyRepository();
const leaveBalanceRepository = new PrismaLeaveBalanceRepository();
const leaveRequestRepository = new PrismaLeaveRequestRepository();

const NOT_AUTHORIZED_TO_MANAGE_LEAVE_POLICIES_MESSAGE = 'Not authorized to manage leave policies.';
const HR_SETTINGS_PATH = '/hr/settings';

function coerceLeavePolicyType(
    value: string,
    fallback: (typeof LEAVE_POLICY_TYPES)[number],
): (typeof LEAVE_POLICY_TYPES)[number] {
    return (LEAVE_POLICY_TYPES as readonly string[]).includes(value) ? (value as (typeof LEAVE_POLICY_TYPES)[number]) : fallback;
}

export async function createLeavePolicyAction(
    previous: LeavePolicyCreateState,
    formData: FormData,
): Promise<LeavePolicyCreateState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:leave-policies:create',
            },
        );
    } catch {
        return {
            status: 'error',
            message: NOT_AUTHORIZED_TO_MANAGE_LEAVE_POLICIES_MESSAGE,
            values: previous.values,
        };
    }

    const candidate = {
        name: readFormString(formData, 'name'),
        type: readFormString(formData, 'type'),
        accrualAmount: readFormString(formData, 'accrualAmount'),
    };

    const parsed = createLeavePolicySchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Check the highlighted fields and try again.',
            fieldErrors: toFieldErrors(parsed.error),
            values: {
                name: candidate.name,
                type: coerceLeavePolicyType(candidate.type, previous.values.type),
                accrualAmount: candidate.accrualAmount,
            },
        };
    }

    try {
        await createLeavePolicy(
            { leavePolicyRepository },
            {
                authorization: session.authorization,
                payload: {
                    orgId: session.authorization.orgId,
                    name: parsed.data.name,
                    type: parsed.data.type,
                    accrualAmount: parsed.data.accrualAmount,
                },
            },
        );

        revalidatePath(HR_SETTINGS_PATH);

        return {
            status: 'success',
            message: 'Leave policy created.',
            values: defaultCreateValues,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to create leave policy.',
            values: {
                name: candidate.name,
                type: coerceLeavePolicyType(candidate.type, previous.values.type),
                accrualAmount: candidate.accrualAmount,
            },
        };
    }
}

export async function updateLeavePolicyAction(
    _previous: LeavePolicyInlineState,
    formData: FormData,
): Promise<LeavePolicyInlineState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:leave-policies:update',
            },
        );
    } catch {
        return {
            status: 'error',
            message: NOT_AUTHORIZED_TO_MANAGE_LEAVE_POLICIES_MESSAGE,
        };
    }

    const activeFromRaw = readFormString(formData, 'activeFrom');
    const activeToRaw = readFormString(formData, 'activeTo');
    const carryOverRaw = readFormString(formData, 'carryOverLimit');
    const maxConsecutiveRaw = readFormString(formData, 'maxConsecutiveDays');

    const candidate = {
        policyId: readFormString(formData, 'policyId'),
        name: readFormString(formData, 'name'),
        type: readFormString(formData, 'type'),
        accrualAmount: readFormString(formData, 'accrualAmount'),
        carryOverLimit: readOptionalNullableValue(carryOverRaw),
        requiresApproval: readFormBoolean(formData, 'requiresApproval', true),
        isDefault: readFormBoolean(formData, 'isDefault', false),
        statutoryCompliance: readFormBoolean(formData, 'statutoryCompliance', false),
        maxConsecutiveDays: readOptionalNullableValue(maxConsecutiveRaw),
        allowNegativeBalance: readFormBoolean(formData, 'allowNegativeBalance', false),
        activeFrom: readOptionalValue(activeFromRaw),
        activeTo: readOptionalNullableValue(activeToRaw),
    };

    const parsed = updateLeavePolicySchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: 'Check the highlighted fields and try again.',
        };
    }

    try {
        const patch = updateLeavePolicyPatchSchema.parse({
            name: parsed.data.name,
            type: parsed.data.type,
            accrualAmount: parsed.data.accrualAmount,
            carryOverLimit: parsed.data.carryOverLimit === undefined ? undefined : parsed.data.carryOverLimit,
            requiresApproval: parsed.data.requiresApproval,
            isDefault: parsed.data.isDefault,
            statutoryCompliance: parsed.data.statutoryCompliance,
            maxConsecutiveDays: parsed.data.maxConsecutiveDays === undefined ? undefined : parsed.data.maxConsecutiveDays,
            allowNegativeBalance: parsed.data.allowNegativeBalance,
            activeFrom: parsed.data.activeFrom,
            activeTo: parsed.data.activeTo === undefined ? undefined : parsed.data.activeTo,
        });

        await updateLeavePolicy(
            { leavePolicyRepository },
            {
                authorization: session.authorization,
                orgId: session.authorization.orgId,
                policyId: parsed.data.policyId,
                patch,
            },
        );

        revalidatePath(HR_SETTINGS_PATH);

        return {
            status: 'success',
            message: 'Leave policy updated.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update leave policy.',
        };
    }
}

export async function deleteLeavePolicyAction(
    _previous: LeavePolicyInlineState,
    formData: FormData,
): Promise<LeavePolicyInlineState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:leave-policies:delete',
            },
        );
    } catch {
        return {
            status: 'error',
            message: NOT_AUTHORIZED_TO_MANAGE_LEAVE_POLICIES_MESSAGE,
        };
    }

    const policyId = readFormString(formData, 'policyId');
    const parsedId = z.uuid().safeParse(policyId);
    if (!parsedId.success) {
        return { status: 'error', message: 'Invalid policy id.' };
    }

    try {
        await deleteLeavePolicy(
            {
                leavePolicyRepository,
                leaveBalanceRepository,
                leaveRequestRepository,
            },
            {
                authorization: session.authorization,
                payload: { orgId: session.authorization.orgId, policyId: parsedId.data },
            },
        );

        revalidatePath(HR_SETTINGS_PATH);

        return {
            status: 'success',
            message: 'Leave policy deleted.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to delete leave policy.',
        };
    }
}
