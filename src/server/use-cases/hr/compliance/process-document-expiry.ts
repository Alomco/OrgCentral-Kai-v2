import { differenceInCalendarDays } from 'date-fns';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { NotificationComposerContract } from '@/server/services/platform/notifications/notification-composer.provider';
import { getNotificationComposerService } from '@/server/services/platform/notifications/notification-composer.provider';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people';

export interface DocumentExpiryPayload {
    dryRun?: boolean;
    thresholdDays?: number[];
}

export interface DocumentExpiryDependencies {
    employeeProfileRepository: IEmployeeProfileRepository;
    notificationComposer: NotificationComposerContract;
    now: () => Date;
}

export interface DocumentExpiryInput {
    authorization: RepositoryAuthorizationContext;
    payload: DocumentExpiryPayload;
}

export interface DocumentExpiryResult {
    processedCount: number;
    notificationsSent: number;
}

interface WorkPermitData {
    expiryDate?: string;
    number?: string;
    type?: string;
}

export function buildDocumentExpiryDependencies(
    overrides: Partial<DocumentExpiryDependencies> = {},
): DocumentExpiryDependencies {
    return {
        employeeProfileRepository: overrides.employeeProfileRepository ?? new PrismaEmployeeProfileRepository(),
        notificationComposer: overrides.notificationComposer ?? getNotificationComposerService(),
        now: overrides.now ?? (() => new Date()),
    };
}

export async function processDocumentExpiry(
    deps: DocumentExpiryDependencies,
    input: DocumentExpiryInput,
): Promise<DocumentExpiryResult> {
    const profiles = await deps.employeeProfileRepository.getEmployeeProfilesByOrganization(
        input.authorization.orgId,
    );

    let notificationsSent = 0;
    const now = deps.now();

    const thresholdDays = input.payload.thresholdDays ?? [30, 14, 7];

    for (const profile of profiles) {
        if (!profile.userId) {
            continue;
        }

        const workPermit = profile.workPermit as WorkPermitData | undefined;
        if (!workPermit?.expiryDate) {
            continue;
        }

        const expiryDate = new Date(workPermit.expiryDate);
        if (Number.isNaN(expiryDate.getTime())) {
            continue;
        }

        const daysUntilExpiry = differenceInCalendarDays(expiryDate, now);
        if (!thresholdDays.includes(daysUntilExpiry)) {
            continue;
        }

        if (input.payload.dryRun) {
            continue;
        }

        await deps.notificationComposer.composeAndSend({
            authorization: input.authorization,
            notification: {
                userId: profile.userId,
                title: 'Document Expiry Warning',
                body: `Your Work Permit (${workPermit.type ?? 'Document'}) expires in ${String(daysUntilExpiry)} days (${expiryDate.toDateString()}). Please renew it.`,
                topic: 'other',
                priority: daysUntilExpiry <= 7 ? 'urgent' : 'high',
                metadata: {
                    documentType: 'workPermit',
                    daysUntilExpiry,
                    expiryDate: expiryDate.toISOString(),
                },
            },
            abac: {
                action: 'notification.compose',
                resourceType: 'notification',
                resourceAttributes: { targetUserId: profile.userId },
            },
        });
        notificationsSent += 1;
    }

    return {
        processedCount: profiles.length,
        notificationsSent,
    };
}
