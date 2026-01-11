import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { ComplianceLogItem } from '@/server/types/compliance-types';
import {
    getHrNotificationService,
    type HrNotificationServiceContract,
} from '@/server/services/hr/notifications/hr-notification-service.provider';
import {
    getNotificationService,
    type NotificationDispatchContract,
} from '@/server/services/notifications/notification-service.provider';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import {
    buildMetadata,
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
    return {
        complianceItemRepository: overrides.complianceItemRepository ?? new PrismaComplianceItemRepository(),
        complianceTemplateRepository:
            overrides.complianceTemplateRepository ?? new PrismaComplianceTemplateRepository(),
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

    const templateRules = await loadTemplateRules(deps.complianceTemplateRepository, input.authorization.orgId);
    const configuredMaxReminderDays = Math.max(
        0,
        ...Array.from(templateRules.values()).map((rule) => rule.reminderDaysBeforeExpiry ?? 0),
    );
    const effectiveWindowDays = Math.max(fallbackWindowDays, configuredMaxReminderDays);

    const allItems = await deps.complianceItemRepository.findExpiringItemsForOrg(
        input.authorization.orgId,
        referenceDate,
        effectiveWindowDays,
    );

    const scopedItems = filterTargetUsers(allItems, input.payload.targetUserIds);
    const filtered = filterByTemplateRules(scopedItems, templateRules, referenceDate, fallbackWindowDays);
    if (filtered.length === 0) {
        return { remindersSent: 0, usersTargeted: 0 };
    }

    const grouped = groupByUser(filtered);
    let remindersSent = 0;
    for (const [userId, items] of grouped) {
        await emitReminder(deps, input.authorization, userId, items, referenceDate);
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
