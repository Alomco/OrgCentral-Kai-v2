'use server';

import { headers } from 'next/headers';
import { complianceReminderSettingsSchema } from '@/server/types/hr-compliance-schemas';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateComplianceReminderSettings } from '@/server/use-cases/hr/compliance/update-compliance-reminder-settings';
import { PrismaComplianceReminderSettingsRepository } from '@/server/repositories/prisma/hr/compliance';

export interface ComplianceReminderSettingsActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function readEscalationDays(formData: FormData): number[] {
    const raw = readFormString(formData, 'escalationDays');
    if (!raw) {
        return [];
    }
    const values = raw
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.round(value));
    return Array.from(new Set(values)).sort((a, b) => b - a);
}

export async function updateComplianceReminderSettingsAction(
    _previous: ComplianceReminderSettingsActionState,
    formData: FormData,
): Promise<ComplianceReminderSettingsActionState> {
    const parsed = complianceReminderSettingsSchema.safeParse({
        windowDays: formData.get('windowDays'),
        escalationDays: readEscalationDays(formData),
        notifyOnComplete: formData.get('notifyOnComplete') === 'on',
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid reminder settings.' };
    }

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:compliance:reminders:update',
                action: 'update',
                resourceType: 'hr.compliance',
                resourceAttributes: { scope: 'reminders' },
            },
        );
    } catch {
        return { status: 'error', message: 'Not authorized to update reminder settings.' };
    }

    try {
        await updateComplianceReminderSettings(
            { complianceReminderSettingsRepository: new PrismaComplianceReminderSettingsRepository() },
            {
                authorization: session.authorization,
                payload: {
                    windowDays: parsed.data.windowDays,
                    escalationDays: parsed.data.escalationDays,
                    notifyOnComplete: parsed.data.notifyOnComplete,
                },
            },
        );

        return { status: 'success', message: 'Reminder settings updated.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update reminder settings.',
        };
    }
}
