import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IComplianceReminderSettingsRepository } from '@/server/repositories/contracts/hr/compliance/compliance-reminder-settings-repository-contract';
import type { ComplianceReminderSettings } from '@/server/types/hr/compliance-reminder-settings';

export interface GetComplianceReminderSettingsInput {
    authorization: RepositoryAuthorizationContext;
}

export interface GetComplianceReminderSettingsDependencies {
    complianceReminderSettingsRepository: IComplianceReminderSettingsRepository;
}

export interface GetComplianceReminderSettingsResult {
    settings: ComplianceReminderSettings;
}

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_ESCALATION_DAYS = [30, 14, 7, 1] as const;

function buildDefaultSettings(orgId: string, authorization: RepositoryAuthorizationContext): ComplianceReminderSettings {
    const now = new Date();
    return {
        orgId,
        windowDays: DEFAULT_WINDOW_DAYS,
        escalationDays: [...DEFAULT_ESCALATION_DAYS],
        notifyOnComplete: false,
        dataClassification: authorization.dataClassification,
        dataResidency: authorization.dataResidency,
        metadata: null,
        createdAt: now,
        updatedAt: now,
    };
}

export async function getComplianceReminderSettings(
    deps: GetComplianceReminderSettingsDependencies,
    input: GetComplianceReminderSettingsInput,
): Promise<GetComplianceReminderSettingsResult> {
    const existing = await deps.complianceReminderSettingsRepository.getSettings(input.authorization.orgId);
    if (existing) {
        return { settings: existing };
    }

    return { settings: buildDefaultSettings(input.authorization.orgId, input.authorization) };
}
