import { differenceInCalendarDays } from 'date-fns';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { ComplianceReminderDependencies, ComplianceReminderPayload } from './send-compliance-reminders';
import type { ComplianceLogItem } from '@/server/types/compliance-types';
import type { NotificationDispatchContract } from '@/server/repositories/contracts/notifications/notification-dispatch-contract';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';

const NOTIFICATION_TYPE_DOCUMENT_EXPIRY = 'document-expiry' as const;
const NOTIFICATION_TYPE_COMPLIANCE_REMINDER = 'compliance-reminder' as const;

export function filterTargetUsers(items: ComplianceLogItem[], targetUserIds?: string[]): ComplianceLogItem[] {
    if (!targetUserIds || targetUserIds.length === 0) {
        return items;
    }
    const targets = new Set(targetUserIds);
    return items.filter((item) => targets.has(item.userId));
}

export function filterByTemplateRules(
    items: ComplianceLogItem[],
    templateRules: Map<string, { reminderDaysBeforeExpiry?: number | null }>,
    referenceDate: Date,
    fallbackWindowDays: number,
    escalationDays: number[] = [],
): ComplianceLogItem[] {
    const normalizedEscalations = escalationDays
        .filter((day) => Number.isFinite(day) && day > 0)
        .map((day) => Math.floor(day));
    return items.filter((item) => {
        const dueDate = item.dueDate;
        if (!dueDate) {
            return false;
        }

        const daysUntilDue = differenceInCalendarDays(dueDate, referenceDate);
        if (daysUntilDue <= 0) {
            return true;
        }

        const rule = templateRules.get(item.templateItemId);
        const reminderDays = rule?.reminderDaysBeforeExpiry;

        if (typeof reminderDays === 'number' && Number.isFinite(reminderDays) && reminderDays > 0) {
            return daysUntilDue === reminderDays;
        }
        if (normalizedEscalations.length > 0) {
            return normalizedEscalations.includes(daysUntilDue);
        }

        return daysUntilDue <= fallbackWindowDays;
    });
}

export function groupByUser(items: ComplianceLogItem[]): Map<string, ComplianceLogItem[]> {
    return items.reduce<Map<string, ComplianceLogItem[]>>((accumulator, item) => {
        const existing = accumulator.get(item.userId) ?? [];
        existing.push(item);
        accumulator.set(item.userId, existing);
        return accumulator;
    }, new Map());
}

export async function emitReminder(
    deps: ComplianceReminderDependencies,
    authorization: RepositoryAuthorizationContext,
    userId: string,
    items: ComplianceLogItem[],
    referenceDate: Date,
    notifyOnComplete: boolean,
): Promise<void> {
    const expiringDocuments = items.filter((item) => item.status === 'COMPLETE');
    const pendingTasks = items.filter((item) => item.status !== 'COMPLETE');

    if (notifyOnComplete && expiringDocuments.length > 0) {
        await sendNotification({
            deps,
            userId,
            items: expiringDocuments,
            referenceDate,
            authorization,
            type: NOTIFICATION_TYPE_DOCUMENT_EXPIRY,
        });
    }

    if (pendingTasks.length > 0) {
        await sendNotification({
            deps,
            userId,
            items: pendingTasks,
            referenceDate,
            authorization,
            type: NOTIFICATION_TYPE_COMPLIANCE_REMINDER,
        });
    }
}

export async function dispatchRealtimeNotification(
    dispatcher: NotificationDispatchContract | undefined,
    authorization: RepositoryAuthorizationContext,
    userId: string,
    params: {
        title: string;
        message: string;
        priority: 'urgent' | 'high' | 'medium';
        referenceDate: Date;
        items: ComplianceLogItem[];
    },
): Promise<void> {
    if (!dispatcher) {
        return;
    }

    await dispatcher.dispatchNotification({
        authorization,
        notification: {
            templateKey: 'hr.compliance.reminder',
            channel: 'IN_APP',
            recipient: { userId },
            data: {
                title: params.title,
                message: params.message,
                priority: params.priority,
                referenceDate: params.referenceDate.toISOString(),
                itemCount: params.items.length,
                items: params.items.map((item) => ({
                    itemId: item.id,
                    templateItemId: item.templateItemId,
                    categoryKey: item.categoryKey,
                    dueDate: item.dueDate?.toISOString() ?? null,
                    status: item.status,
                })),
            },
        },
    });
}

export async function sendNotification(params: {
    deps: ComplianceReminderDependencies;
    userId: string;
    items: ComplianceLogItem[];
    referenceDate: Date;
    authorization: RepositoryAuthorizationContext;
    type: typeof NOTIFICATION_TYPE_COMPLIANCE_REMINDER | typeof NOTIFICATION_TYPE_DOCUMENT_EXPIRY;
}): Promise<void> {
    const { deps, userId, items, referenceDate, authorization, type } = params;
    const sorted = [...items].sort((a, b) => {
        const aTime = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
    });
    const nearestDue = sorted[0]?.dueDate ?? referenceDate;
    const daysUntilDue = Math.max(0, differenceInCalendarDays(nearestDue, referenceDate));
    const priority = resolvePriority(daysUntilDue);

    const title =
        type === NOTIFICATION_TYPE_DOCUMENT_EXPIRY
            ? daysUntilDue <= 1
                ? 'Document expiring now'
                : `Document expiring in ${String(daysUntilDue)} days`
            : daysUntilDue <= 1
                ? 'Compliance task due now'
                : `Compliance tasks due in ${String(daysUntilDue)} days`;

    const message = buildMessage(items.length, nearestDue, type);

    await emitHrNotification(
        { service: deps.notificationService },
        {
            authorization,
            notification: {
                userId,
                title,
                message,
                type,
                priority,
                metadata: {
                    items: items.map((item) => ({
                        itemId: item.id,
                        templateItemId: item.templateItemId,
                        categoryKey: item.categoryKey,
                        dueDate: item.dueDate?.toISOString() ?? null,
                        status: item.status,
                    })),
                    referenceDate: referenceDate.toISOString(),
                },
            },
        },
    );

    await dispatchRealtimeNotification(deps.notificationDispatcher, authorization, userId, {
        title,
        message,
        priority,
        referenceDate,
        items,
    });
}

export function buildMetadata(params: ComplianceReminderPayload): Record<string, unknown> {
    return {
        daysUntilExpiry: params.daysUntilExpiry,
        referenceDate: params.referenceDate?.toISOString(),
    } satisfies Record<string, unknown>;
}

function resolvePriority(daysUntilDue: number) {
    if (daysUntilDue <= 1) {
        return 'urgent' as const;
    }
    if (daysUntilDue <= 3) {
        return 'high' as const;
    }
    return 'medium' as const;
}

function buildMessage(
    itemCount: number,
    dueDate: Date,
    type: typeof NOTIFICATION_TYPE_COMPLIANCE_REMINDER | typeof NOTIFICATION_TYPE_DOCUMENT_EXPIRY,
): string {
    const formatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' });
    const dateLabel = formatter.format(dueDate);
    const noun = itemCount === 1 ? 'task' : 'tasks';

    if (type === NOTIFICATION_TYPE_DOCUMENT_EXPIRY) {
        const documentNoun = itemCount === 1 ? 'document is' : 'documents are';
        return `You have ${String(itemCount)} compliance ${documentNoun} expiring by ${dateLabel}. Please review and renew if necessary.`;
    }

    return `You have ${String(itemCount)} compliance ${noun} due by ${dateLabel}. Review the compliance workspace to upload the required evidence.`;
}
