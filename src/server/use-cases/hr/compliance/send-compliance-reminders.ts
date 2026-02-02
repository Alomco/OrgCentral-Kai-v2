import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { IComplianceReminderSettingsRepository } from '@/server/repositories/contracts/hr/compliance/compliance-reminder-settings-repository-contract';
import { getHrNotificationService } from '@/server/services/hr/notifications/hr-notification-service.provider';
import type { HrNotificationServiceContract } from '@/server/repositories/contracts/notifications';
import { getNotificationService } from '@/server/services/notifications/notification-service.provider';
import type { NotificationDispatchContract } from '@/server/repositories/contracts/notifications/notification-dispatch-contract';
import { buildComplianceRepositoryDependencies } from '@/server/repositories/providers/hr/compliance-repository-dependencies';
import { createComplianceReminderSettingsRepository } from '@/server/repositories/providers/hr/compliance-reminder-settings-repository-provider';
import {
    emitReminder,
    filterByTemplateRules,
    filterTargetUsers,
    groupByUser,
} from './compliance-reminders.helpers';

export interface ComplianceReminderPayload {
    referenceDate?: Date;
    daysUntilExpiry?: number;
    targetUserIds?: string[];
}

export interface ComplianceReminderDependencies {
    complianceItemRepository: IComplianceItemRepository;
    complianceTemplateRepository?: IComplianceTemplateRepository;
    complianceReminderSettingsRepository?: IComplianceReminderSettingsRepository;
    notificationService?: HrNotificationServiceContract;
    notificationDispatcher?: NotificationDispatchContract;
}

export interface ComplianceReminderInput {
    authorization: RepositoryAuthorizationContext;
    payload: ComplianceReminderPayload;
}

export interface ComplianceReminderResult {
    remindersSent: number;
    usersTargeted: number;
}

export function buildComplianceReminderDependencies(
    overrides: Partial<ComplianceReminderDependencies> = {},
): ComplianceReminderDependencies {
    const { complianceItemRepository, complianceTemplateRepository } =
        buildComplianceRepositoryDependencies({
            overrides: {
                complianceItemRepository: overrides.complianceItemRepository,
                complianceTemplateRepository: overrides.complianceTemplateRepository,
            },
        });

    return {
        complianceItemRepository,
        complianceTemplateRepository,
        complianceReminderSettingsRepository:
            overrides.complianceReminderSettingsRepository ?? createComplianceReminderSettingsRepository(),
        notificationService: overrides.notificationService ?? getHrNotificationService(),
        notificationDispatcher: overrides.notificationDispatcher ?? getNotificationService(),
    };
}

export async function sendComplianceReminders(
    deps: ComplianceReminderDependencies,
    input: ComplianceReminderInput,
): Promise<ComplianceReminderResult> {
    const referenceDate = input.payload.referenceDate ?? new Date();
    const fallbackWindowDays = input.payload.daysUntilExpiry ?? 30;

    const reminderSettings = deps.complianceReminderSettingsRepository
        ? await deps.complianceReminderSettingsRepository.getSettings(input.authorization.orgId)
        : null;
    const windowDays = reminderSettings?.windowDays ?? fallbackWindowDays;
    const escalationDays = reminderSettings?.escalationDays ?? [];
    const notifyOnComplete = reminderSettings?.notifyOnComplete ?? false;

    const templateRules = await loadTemplateRules(deps.complianceTemplateRepository, input.authorization.orgId);
    const configuredMaxReminderDays = Math.max(
        0,
        ...Array.from(templateRules.values()).map((rule) => rule.reminderDaysBeforeExpiry ?? 0),
        ...escalationDays,
    );
    const effectiveWindowDays = Math.max(windowDays, configuredMaxReminderDays);

    const allItems = await deps.complianceItemRepository.findExpiringItemsForOrg(
        input.authorization.orgId,
        referenceDate,
        effectiveWindowDays,
    );

    const scopedItems = filterTargetUsers(allItems, input.payload.targetUserIds);
    const filtered = filterByTemplateRules(
        scopedItems,
        templateRules,
        referenceDate,
        effectiveWindowDays,
        escalationDays,
    );
    if (filtered.length === 0) {
        return { remindersSent: 0, usersTargeted: 0 };
    }

    const grouped = groupByUser(filtered);
    let remindersSent = 0;
    for (const [userId, items] of grouped) {
        await emitReminder(deps, input.authorization, userId, items, referenceDate, notifyOnComplete);
        remindersSent += 1;
    }

    return { remindersSent, usersTargeted: grouped.size };
}

async function loadTemplateRules(
    repository: IComplianceTemplateRepository | undefined,
    orgId: string,
): Promise<Map<string, { reminderDaysBeforeExpiry?: number | null }>> {
    if (!repository) {
        return new Map();
    }

    const templates = await repository.listTemplates(orgId);
    const rules = new Map<string, { reminderDaysBeforeExpiry?: number | null }>();
    for (const template of templates) {
        for (const item of template.items) {
            rules.set(item.id, { reminderDaysBeforeExpiry: item.reminderDaysBeforeExpiry ?? null });
        }
    }
    return rules;
}
