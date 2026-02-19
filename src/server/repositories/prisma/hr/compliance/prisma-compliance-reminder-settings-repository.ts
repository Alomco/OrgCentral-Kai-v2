import type { PrismaClient } from '@prisma/client';

import { BasePrismaRepository } from '@/server/repositories/prisma/base-prisma-repository';
import type { IComplianceReminderSettingsRepository } from '@/server/repositories/contracts/hr/compliance/compliance-reminder-settings-repository-contract';
import type { ComplianceReminderSettings, ComplianceReminderSettingsInput } from '@/server/types/hr/compliance-reminder-settings';
import { toPrismaInputJson } from '@/server/repositories/prisma/helpers/prisma-utils';

export class PrismaComplianceReminderSettingsRepository
    extends BasePrismaRepository
    implements IComplianceReminderSettingsRepository {
    private get reminderSettings(): PrismaClient['complianceReminderSettings'] {
        return this.prisma.complianceReminderSettings;
    }

    async getSettings(orgId: string): Promise<ComplianceReminderSettings | null> {
        const record = await this.reminderSettings.findUnique({ where: { orgId } });
        if (!record) {
            return null;
        }
        return {
            orgId: record.orgId,
            windowDays: record.windowDays,
            escalationDays: record.escalationDays,
            notifyOnComplete: record.notifyOnComplete,
            dataClassification: record.dataClassification,
            dataResidency: record.residencyTag,
            metadata: record.metadata as ComplianceReminderSettings['metadata'],
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    async upsertSettings(orgId: string, input: ComplianceReminderSettingsInput): Promise<ComplianceReminderSettings> {
        const metadata = toPrismaInputJson(input.metadata);
        const record = await this.reminderSettings.upsert({
            where: { orgId },
            create: {
                orgId,
                windowDays: input.windowDays,
                escalationDays: input.escalationDays,
                notifyOnComplete: input.notifyOnComplete,
                metadata,
            },
            update: {
                windowDays: input.windowDays,
                escalationDays: input.escalationDays,
                notifyOnComplete: input.notifyOnComplete,
                metadata,
            },
        });

        return {
            orgId: record.orgId,
            windowDays: record.windowDays,
            escalationDays: record.escalationDays,
            notifyOnComplete: record.notifyOnComplete,
            dataClassification: record.dataClassification,
            dataResidency: record.residencyTag,
            metadata: record.metadata as ComplianceReminderSettings['metadata'],
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
}
