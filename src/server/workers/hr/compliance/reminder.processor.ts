import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { HrNotificationServiceContract } from '@/server/services/hr/notifications/hr-notification-service.provider';
import type { NotificationDispatchContract } from '@/server/services/notifications/notification-service.provider';
import { complianceReminderPayloadSchema, type ComplianceReminderPayload } from './reminder.types';
import {
    buildComplianceReminderDependencies,
    sendComplianceReminders,
    type ComplianceReminderDependencies,
    type ComplianceReminderResult,
} from '@/server/use-cases/hr/compliance/send-compliance-reminders';

type ComplianceReminderProcessorDeps = Partial<ComplianceReminderDependencies> & {
    complianceItemRepository?: IComplianceItemRepository;
    complianceTemplateRepository?: IComplianceTemplateRepository;
    notificationService?: HrNotificationServiceContract;
    notificationDispatcher?: NotificationDispatchContract;
};

type ReminderStats = ComplianceReminderResult;

export class ComplianceReminderProcessor {
    private readonly deps: ComplianceReminderDependencies;

    constructor(deps: ComplianceReminderProcessorDeps = {}) {
        this.deps = buildComplianceReminderDependencies(deps);
    }

    async process(
        payload: ComplianceReminderPayload,
        authorization: RepositoryAuthorizationContext,
    ): Promise<ReminderStats> {
        const parsedPayload = complianceReminderPayloadSchema.parse(payload);
        return sendComplianceReminders(this.deps, {
            authorization,
            payload: parsedPayload,
        });
    }
}
