'use server';

import { randomUUID } from 'node:crypto';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { requireSessionUser } from '@/server/api-adapters/http/session-helpers';
import { resolveHoursPerDay } from '@/server/domain/leave/hours-per-day-resolver';
import { PrismaAbsenceSettingsRepository } from '@/server/repositories/prisma/hr/absences';
import { getLeaveService } from '@/server/services/hr/leave/leave-service.provider';
import type { LeaveRequest } from '@/server/types/leave-types';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';

import { toFieldErrors } from '../_components/form-errors';
import { leaveRequestFormValuesSchema } from './schema';
import type { LeaveRequestFormState } from './form-state';

const FIELD_CHECK_MESSAGE = 'Check the highlighted fields and try again.';

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
}

function parseIsoDateInput(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error('Date is required.');
    }

    const date = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date.');
    }

    return date.toISOString();
}

const absenceSettingsRepository = new PrismaAbsenceSettingsRepository();

function toDateFieldError(field: 'startDate' | 'endDate', error: unknown): Pick<LeaveRequestFormState, 'status' | 'message' | 'fieldErrors'> {
    return {
        status: 'error',
        message: FIELD_CHECK_MESSAGE,
        fieldErrors: {
            [field]: error instanceof Error
                ? error.message
                : field === 'startDate'
                    ? 'Invalid start date.'
                    : 'Invalid end date.',
        },
    };
}

export async function submitLeaveRequestAction(
    previous: LeaveRequestFormState,
    formData: FormData,
): Promise<LeaveRequestFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();

        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { employeeProfile: ['read'] },
                auditSource: 'ui:hr:leave:submit',
                action: HR_ACTION.CREATE,
                resourceType: HR_RESOURCE.HR_LEAVE,
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to submit leave requests.',
            values: previous.values,
        };
    }

    const candidate = {
        leaveType: readFormString(formData, 'leaveType'),
        startDate: readFormString(formData, 'startDate'),
        endDate: readFormString(formData, 'endDate') || undefined,
        totalDays: formData.get('totalDays'),
        isHalfDay: formData.get('isHalfDay'),
        reason: readFormString(formData, 'reason') || undefined,
    };

    const parsed = leaveRequestFormValuesSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_CHECK_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: {
                ...previous.values,
                leaveType: typeof candidate.leaveType === 'string' ? candidate.leaveType : previous.values.leaveType,
                startDate: typeof candidate.startDate === 'string' ? candidate.startDate : previous.values.startDate,
                endDate: typeof candidate.endDate === 'string' ? candidate.endDate : previous.values.endDate,
                reason: typeof candidate.reason === 'string' ? candidate.reason : previous.values.reason,
                totalDays: previous.values.totalDays,
                isHalfDay: previous.values.isHalfDay,
            },
        };
    }

    try {
        const { userId } = requireSessionUser(session.session);

        let startDate: string;
        let endDate: string;

        try {
            startDate = parseIsoDateInput(parsed.data.startDate);
        } catch (error) {
            return {
                ...toDateFieldError('startDate', error),
                values: parsed.data,
            };
        }

        if (parsed.data.endDate) {
            try {
                endDate = parseIsoDateInput(parsed.data.endDate);
            } catch (error) {
                return {
                    ...toDateFieldError('endDate', error),
                    values: parsed.data,
                };
            }
        } else {
            endDate = startDate;
        }

        const hoursPerDay = await resolveHoursPerDay(absenceSettingsRepository, session.authorization.orgId);

        const requestId = randomUUID();
        const employeeName = session.session.user.name.length > 0
            ? session.session.user.name
            : session.session.user.email;

        const request: Omit<LeaveRequest, 'createdAt'> & { hoursPerDay: number } = {
            id: requestId,
            orgId: session.authorization.orgId,
            employeeId: session.authorization.userId,
            userId: session.authorization.userId,
            employeeName,
            leaveType: parsed.data.leaveType,
            startDate,
            endDate,
            reason: parsed.data.reason,
            totalDays: parsed.data.totalDays,
            isHalfDay: parsed.data.isHalfDay ?? false,
            status: 'submitted',
            createdBy: userId,
            submittedAt: new Date().toISOString(),
            hoursPerDay,
            dataResidency: session.authorization.dataResidency,
            dataClassification: session.authorization.dataClassification,
            auditSource: 'ui:hr-leave:submit',
        };

        const service = getLeaveService();
        await service.submitLeaveRequest({ authorization: session.authorization, request });

        return {
            status: 'success',
            message: 'Leave request submitted.',
            fieldErrors: undefined,
            values: {
                ...parsed.data,
                reason: '',
            },
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to submit leave request.',
            fieldErrors: undefined,
            values: previous.values,
        };
    }
}
