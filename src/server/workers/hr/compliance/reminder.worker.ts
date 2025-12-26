import type { WorkerOptions } from 'bullmq';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/workers/constants';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import {
    complianceReminderEnvelopeSchema,
    type ComplianceReminderPayload,
    COMPLIANCE_REMINDER_JOB_NAME,
} from './reminder.types';
import { ComplianceReminderProcessor } from './reminder.processor';
import { getNotificationService } from '@/server/services/notifications/notification-service.provider';

export interface ComplianceReminderWorkerOptions {
    worker?: WorkerOptions;
    processor?: ComplianceReminderProcessor;
}

export class ComplianceReminderWorker extends AbstractOrgWorker<ComplianceReminderPayload> {
    private readonly processor: ComplianceReminderProcessor;

    constructor(options?: ComplianceReminderWorkerOptions) {
        super({
            queueName: WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER,
            workerName: COMPLIANCE_REMINDER_JOB_NAME,
            schema: complianceReminderEnvelopeSchema,
        });
        this.processor = options?.processor ??
            new ComplianceReminderProcessor({
                complianceItemRepository: new PrismaComplianceItemRepository(),
                complianceTemplateRepository: new PrismaComplianceTemplateRepository(),
                notificationDispatcher: getNotificationService(),
            });
    }

    protected async process(
        payload: ComplianceReminderPayload,
        context: RepositoryAuthorizationContext,
    ): Promise<unknown> {
        const result = await this.processor.process(payload, context);
        this.logger.info('hr.compliance.reminder.processed', {
            orgId: context.orgId,
            remindersSent: result.remindersSent,
            usersTargeted: result.usersTargeted,
        });
        return result;
    }
}

export function registerComplianceReminderWorker(options?: ComplianceReminderWorkerOptions) {
    const worker = new ComplianceReminderWorker(options);
    return worker.registerWorker(options?.worker);
}
