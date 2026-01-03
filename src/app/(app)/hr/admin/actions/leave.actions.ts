'use server';

/**
 * Leave Management Admin Actions
 * Single Responsibility: Server actions for leave approvals/rejections
 */

import { revalidatePath } from 'next/cache';
import { headers as nextHeaders } from 'next/headers';

import { PrismaLeaveRequestRepository } from '@/server/repositories/prisma/hr/leave/prisma-leave-request-repository';
import { PrismaLeaveBalanceRepository } from '@/server/repositories/prisma/hr/leave/prisma-leave-balance-repository';
import { PrismaLeavePolicyRepository } from '@/server/repositories/prisma/hr/leave/prisma-leave-policy-repository';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { approveLeaveRequest } from '@/server/use-cases/hr/leave/approve-leave-request';
import { rejectLeaveRequest } from '@/server/use-cases/hr/leave/reject-leave-request';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { approveLeaveFormSchema, rejectLeaveFormSchema } from '../_schemas';
import type { LeaveApprovalFormState } from '../_types';

/** Dependency injection factory - Open/Closed: swap implementations via DI */
function createLeaveDependencies() {
    return {
        leaveRequestRepository: new PrismaLeaveRequestRepository(),
        leaveBalanceRepository: new PrismaLeaveBalanceRepository(),
        leavePolicyRepository: new PrismaLeavePolicyRepository(),
        organizationRepository: new PrismaOrganizationRepository(),
    };
}

export async function approveLeaveAction(
    _previous: LeaveApprovalFormState,
    formData: FormData,
): Promise<LeaveApprovalFormState> {
    const headerStore = await nextHeaders();

    let authorization;
    try {
        const session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:admin:leave:approve',
        });
        authorization = session.authorization;
    } catch {
        return { status: 'error', message: 'Not authorized to approve leave requests.' };
    }

    const parsed = approveLeaveFormSchema.safeParse({
        requestId: formData.get('requestId'),
        comments: formData.get('comments') ?? undefined,
    });

    if (!parsed.success) {
        const validationMessage = parsed.error.issues[0].message;
        return {
            status: 'error',
            message: validationMessage,
        };
    }

    try {
        const deps = createLeaveDependencies();
        await approveLeaveRequest(deps, {
            authorization,
            requestId: parsed.data.requestId,
            approverId: authorization.userId,
            comments: parsed.data.comments,
        });

        revalidatePath('/hr/admin');
        revalidatePath('/hr/leave');

        return { 
            status: 'success', 
            message: 'Leave request approved successfully.',
            requestId: parsed.data.requestId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to approve leave request.';
        return { status: 'error', message };
    }
}

export async function rejectLeaveAction(
    _previous: LeaveApprovalFormState,
    formData: FormData,
): Promise<LeaveApprovalFormState> {
    const headerStore = await nextHeaders();

    let authorization;
    try {
        const session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:admin:leave:reject',
        });
        authorization = session.authorization;
    } catch {
        return { status: 'error', message: 'Not authorized to reject leave requests.' };
    }

    const parsed = rejectLeaveFormSchema.safeParse({
        requestId: formData.get('requestId'),
        reason: formData.get('reason'),
    });

    if (!parsed.success) {
        const validationMessage = parsed.error.issues[0].message;
        return {
            status: 'error',
            message: validationMessage,
        };
    }

    try {
        const deps = createLeaveDependencies();
        await rejectLeaveRequest(deps, {
            authorization,
            requestId: parsed.data.requestId,
            rejectedBy: authorization.userId,
            reason: parsed.data.reason,
        });

        revalidatePath('/hr/admin');
        revalidatePath('/hr/leave');

        return { 
            status: 'success', 
            message: 'Leave request rejected.',
            requestId: parsed.data.requestId,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to reject leave request.';
        return { status: 'error', message };
    }
}
