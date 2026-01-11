import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IChecklistInstanceRepository } from '@/server/repositories/contracts/hr/onboarding/checklist-instance-repository-contract';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { NotificationComposerContract } from '@/server/services/platform/notifications/notification-composer.provider';
import { getNotificationComposerService } from '@/server/services/platform/notifications/notification-composer.provider';
import { PrismaChecklistInstanceRepository } from '@/server/repositories/prisma/hr/onboarding';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';

export interface OnboardingReminderPayload {
    dryRun?: boolean;
}

export interface OnboardingReminderDependencies {
    checklistInstanceRepository: IChecklistInstanceRepository;
    employeeProfileRepository: IEmployeeProfileRepository;
    notificationComposer: NotificationComposerContract;
    now: () => Date;
    minDaysSinceStart: number;
}

export interface OnboardingReminderInput {
    authorization: RepositoryAuthorizationContext;
    payload: OnboardingReminderPayload;
}

export interface OnboardingReminderResult {
    processedCount: number;
    notificationsSent: number;
}

const DEFAULT_MIN_DAYS_SINCE_START = 3;

export function buildOnboardingReminderDependencies(
    overrides: Partial<OnboardingReminderDependencies> = {},
): OnboardingReminderDependencies {
    return {
        checklistInstanceRepository:
            overrides.checklistInstanceRepository ?? new PrismaChecklistInstanceRepository(),
        employeeProfileRepository:
            overrides.employeeProfileRepository ?? new PrismaEmployeeProfileRepository(),
        notificationComposer: overrides.notificationComposer ?? getNotificationComposerService(),
        now: overrides.now ?? (() => new Date()),
        minDaysSinceStart: overrides.minDaysSinceStart ?? DEFAULT_MIN_DAYS_SINCE_START,
    };
}

export async function sendOnboardingReminders(
    deps: OnboardingReminderDependencies,
    input: OnboardingReminderInput,
): Promise<OnboardingReminderResult> {
    const pendingChecklists = await deps.checklistInstanceRepository.findPendingChecklists(
        input.authorization.orgId,
    );

    let notificationsSent = 0;
    const now = deps.now();

    for (const checklist of pendingChecklists) {
        const daysSinceStart = (now.getTime() - checklist.startedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceStart < deps.minDaysSinceStart) {
            continue;
        }

        const employee = await deps.employeeProfileRepository.getEmployeeProfile(
            input.authorization.orgId,
            checklist.employeeId,
        );
        if (!employee?.userId) {
            continue;
        }

        if (input.payload.dryRun) {
            continue;
        }

        await deps.notificationComposer.composeAndSend({
            authorization: input.authorization,
            notification: {
                userId: employee.userId,
                title: 'Onboarding Checklist Reminder',
                body: `Your checklist "${checklist.templateName ?? 'Onboarding'}" is still in progress. Please complete outstanding items.`,
                topic: 'other',
                priority: 'high',
                actionUrl: `/hr/onboarding/checklists/${checklist.id}`,
                metadata: { checklistId: checklist.id },
            },
            abac: {
                action: 'notification.compose',
                resourceType: 'notification',
                resourceAttributes: { targetUserId: employee.userId },
            },
        });
        notificationsSent += 1;
    }

    return {
        processedCount: pendingChecklists.length,
        notificationsSent,
    };
}
