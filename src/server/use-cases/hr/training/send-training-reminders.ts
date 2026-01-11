import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ITrainingRecordRepository } from '@/server/repositories/contracts/hr/training/training-record-repository-contract';
import { PrismaTrainingRecordRepository } from '@/server/repositories/prisma/hr/training';
import type { TrainingRecord } from '@/server/types/hr-types';
import {
    getHrNotificationService,
    type HrNotificationServiceContract,
} from '@/server/services/hr/notifications/hr-notification-service.provider';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';

export interface TrainingReminderPayload {
    referenceDate?: Date;
    daysUntilExpiry?: number;
    targetUserIds?: string[];
    includeOverdue?: boolean;
}

export interface TrainingReminderDependencies {
    trainingRepository: ITrainingRecordRepository;
    notificationService: HrNotificationServiceContract;
    now: () => Date;
}

export interface TrainingReminderInput {
    authorization: RepositoryAuthorizationContext;
    payload: TrainingReminderPayload;
}

export interface TrainingReminderResult {
    remindersSent: number;
    usersTargeted: number;
}

export function buildTrainingReminderDependencies(
    overrides: Partial<TrainingReminderDependencies> = {},
): TrainingReminderDependencies {
    return {
        trainingRepository: overrides.trainingRepository ?? new PrismaTrainingRecordRepository(),
        notificationService: overrides.notificationService ?? getHrNotificationService(),
        now: overrides.now ?? (() => new Date()),
    };
}

export async function sendTrainingReminders(
    deps: TrainingReminderDependencies,
    input: TrainingReminderInput,
): Promise<TrainingReminderResult> {
    const referenceDate = input.payload.referenceDate ?? deps.now();
    const daysUntilExpiry = input.payload.daysUntilExpiry ?? 30;
    const includeOverdue = input.payload.includeOverdue ?? true;
    const dueBefore = addDays(referenceDate, daysUntilExpiry);
    const targetUserIds = input.payload.targetUserIds;
    const singleTargetUserId = targetUserIds?.length === 1 ? targetUserIds[0] : undefined;

    const dueRecords = await deps.trainingRepository.getTrainingRecordsByOrganization(
        input.authorization.orgId,
        {
            expiryAfter: referenceDate,
            expiryBefore: dueBefore,
            userId: singleTargetUserId,
        },
    );

    const overdueRecords = includeOverdue
        ? await deps.trainingRepository.getTrainingRecordsByOrganization(
            input.authorization.orgId,
            {
                expiryBefore: referenceDate,
                userId: singleTargetUserId,
            },
        )
        : [];

    const targetSet = input.payload.targetUserIds?.length
        ? new Set(input.payload.targetUserIds)
        : null;
    const filteredDue = filterByTargets(dueRecords, targetSet);
    const filteredOverdue = filterByTargets(overdueRecords, targetSet);

    let remindersSent = 0;
    const targetedUsers = new Set<string>();

    for (const record of filteredDue) {
        await notifyUser(deps, input.authorization, record, {
            title: 'Training expiring soon',
            message: `${record.courseName} expires on ${formatDate(record.expiryDate) ?? 'soon'}.`,
            type: 'training-due',
            priority: 'medium',
        });
        remindersSent += 1;
        targetedUsers.add(record.userId);
    }

    for (const record of filteredOverdue) {
        await notifyUser(deps, input.authorization, record, {
            title: 'Training overdue',
            message: `${record.courseName} has expired.`,
            type: 'training-overdue',
            priority: 'high',
        });
        remindersSent += 1;
        targetedUsers.add(record.userId);
    }

    return {
        remindersSent,
        usersTargeted: targetedUsers.size,
    };
}

function filterByTargets(
    records: TrainingRecord[],
    targets: Set<string> | null,
): TrainingRecord[] {
    if (!targets) {
        return records;
    }
    return records.filter((record) => targets.has(record.userId));
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(value: Date | null | undefined): string | null {
    if (!value) {
        return null;
    }
    return value.toISOString().slice(0, 10);
}

async function notifyUser(
    deps: TrainingReminderDependencies,
    authorization: RepositoryAuthorizationContext,
    record: TrainingRecord,
    notification: {
        title: string;
        message: string;
        type: 'training-due' | 'training-overdue';
        priority: 'medium' | 'high';
    },
): Promise<void> {
    await emitHrNotification(
        { service: deps.notificationService },
        {
            authorization,
            notification: {
                userId: record.userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                priority: notification.priority,
                actionUrl: `/hr/training/${record.id}`,
                metadata: {
                    recordId: record.id,
                    courseName: record.courseName,
                    expiryDate: record.expiryDate ?? null,
                    status: record.status,
                },
                dataClassification: authorization.dataClassification,
                residencyTag: authorization.dataResidency,
            },
        },
    );
}
