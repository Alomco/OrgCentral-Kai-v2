import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { HrNotificationServiceContract } from '@/server/services/hr/notifications/hr-notification-service.provider';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';
import type { LeaveDecisionContext } from '@/server/use-cases/hr/leave/shared/leave-request-helpers';
import type { LeaveRequest } from '@/server/types/leave-types';
import type {
    CancelNotificationContext,
    LeaveNotificationLogger,
} from './leave-service.notifications.types';

const decisionDateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

export async function sendApprovalNotification(
    authorization: RepositoryAuthorizationContext,
    context: LeaveDecisionContext,
    notificationService: HrNotificationServiceContract | undefined,
    logger: LeaveNotificationLogger,
): Promise<void> {
    if (!context.userId) {
        logger.warn('Skipping leave approval notification due to missing userId', {
            orgId: authorization.orgId,
            requestId: context.requestId,
        });
        return;
    }

    await emitHrNotification(
        { service: notificationService },
        {
            authorization,
            notification: {
                userId: context.userId,
                title: 'Leave Request Approved',
                message: buildDecisionMessage(context, 'approved'),
                type: 'leave-approval',
                priority: 'medium',
                actionUrl: '/hr/leave',
                actionLabel: 'View Leave Calendar',
                createdByUserId: authorization.userId,
                correlationId: authorization.correlationId,
                dataClassification: authorization.dataClassification,
                residencyTag: authorization.dataResidency,
                metadata: {
                    requestId: context.requestId,
                    leaveType: context.leaveType,
                    decision: 'approved',
                    totalDays: context.totalDays,
                },
            },
        },
    );
}

export async function sendRejectionNotification(
    authorization: RepositoryAuthorizationContext,
    context: LeaveDecisionContext,
    reason: string,
    notificationService: HrNotificationServiceContract | undefined,
    logger: LeaveNotificationLogger,
): Promise<void> {
    if (!context.userId) {
        logger.warn('Skipping leave rejection notification due to missing userId', {
            orgId: authorization.orgId,
            requestId: context.requestId,
        });
        return;
    }

    await emitHrNotification(
        { service: notificationService },
        {
            authorization,
            notification: {
                userId: context.userId,
                title: 'Leave Request Rejected',
                message: buildDecisionMessage(context, 'rejected', reason),
                type: 'leave-rejection',
                priority: 'high',
                actionUrl: '/hr/leave',
                actionLabel: 'View Details',
                createdByUserId: authorization.userId,
                correlationId: authorization.correlationId,
                dataClassification: authorization.dataClassification,
                residencyTag: authorization.dataResidency,
                metadata: {
                    requestId: context.requestId,
                    leaveType: context.leaveType,
                    decision: 'rejected',
                    totalDays: context.totalDays,
                    reason,
                },
            },
        },
    );
}

export async function sendCancelNotification(
    authorization: RepositoryAuthorizationContext,
    context: CancelNotificationContext,
    notificationService: HrNotificationServiceContract | undefined,
    logger: LeaveNotificationLogger,
): Promise<void> {
    if (!context.userId) {
        logger.warn('Skipping leave cancellation notification due to missing userId', {
            orgId: authorization.orgId,
            requestId: context.requestId,
        });
        return;
    }

    await emitHrNotification(
        { service: notificationService },
        {
            authorization,
            notification: {
                userId: context.userId,
                title: 'Leave Request Cancelled',
                message: buildDecisionMessage(
                    {
                        requestId: context.requestId,
                        leaveType: context.leaveType,
                        totalDays: context.totalDays,
                        startDate: context.startDate,
                        endDate: context.endDate,
                    },
                    'cancelled',
                    context.reason ?? undefined,
                ),
                type: 'other',
                priority: 'medium',
                actionUrl: '/hr/leave',
                actionLabel: 'View Leave Calendar',
                createdByUserId: authorization.userId,
                correlationId: authorization.correlationId,
                dataClassification: authorization.dataClassification,
                residencyTag: authorization.dataResidency,
                metadata: {
                    requestId: context.requestId,
                    leaveType: context.leaveType,
                    decision: 'cancelled',
                    totalDays: context.totalDays,
                    employeeId: context.employeeId,
                    reason: context.reason ?? undefined,
                },
            },
        },
    );
}

export async function safelyDispatchNotification(
    dispatcher: () => Promise<void>,
    failureMessage: string,
    metadata: Record<string, unknown>,
    logger: LeaveNotificationLogger,
): Promise<void> {
    try {
        await dispatcher();
    } catch (error) {
        logger.error(failureMessage, {
            ...metadata,
            error: error instanceof Error ? error.message : error,
        });
    }
}

function buildDecisionMessage(
    context: LeaveDecisionContext,
    decision: 'approved' | 'rejected',
    reason?: string,
): string;
function buildDecisionMessage(
    context: Pick<LeaveRequest, 'totalDays' | 'startDate' | 'endDate'> & { requestId: string; employeeId?: string; leaveType?: string },
    decision: 'cancelled',
    reason?: string,
): string;
function buildDecisionMessage(
    context: LeaveDecisionContext | (Pick<LeaveRequest, 'totalDays' | 'startDate' | 'endDate'> & { requestId: string }),
    decision: 'approved' | 'rejected' | 'cancelled',
    reason?: string,
): string {
    const totalDaysLabel = formatTotalDays(context.totalDays);
    const start = formatDecisionDate(context.startDate);
    const end = formatDecisionDate(context.endDate);
    const base = `Your leave request for ${totalDaysLabel} (${start} - ${end}) has been ${decision}.`;
    if ((decision === 'rejected' || decision === 'cancelled') && reason) {
        return `${base} Reason: ${reason}`;
    }
    return base;
}

function formatDecisionDate(value?: string): string {
    if (!value) {
        return 'Unknown date';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return decisionDateFormatter.format(parsed);
}

function formatTotalDays(totalDays: number): string {
    const normalized = Number.isFinite(totalDays) ? totalDays.toString() : String(totalDays);
    return `${normalized} ${totalDays === 1 ? 'day' : 'days'}`;
}
