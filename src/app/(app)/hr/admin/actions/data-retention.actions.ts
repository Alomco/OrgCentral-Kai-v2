'use server';

import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';
import { runPeopleRetentionSweepJob } from '@/server/services/hr/people/sar/people-sar.jobs';
import { scheduleNightlyRetentionSweep } from '@/server/services/hr/people/sar/people-retention.schedule';

interface RetentionActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

export async function runRetentionSweepAction(
    _previous: RetentionActionState,
    _formData: FormData,
): Promise<RetentionActionState> {
    void _previous;
    void _formData;

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:admin:retention:sweep',
            action: HR_ACTION.MANAGE,
            resourceType: HR_RESOURCE.HR_SETTINGS,
        });
    } catch {
        return { status: 'error', message: 'Not authorized to run retention sweeps.' };
    }

    try {
        const result = await runPeopleRetentionSweepJob(
            session.authorization,
            session.authorization.correlationId,
        );
        return {
            status: 'success',
            message: `Scheduled ${String(result.profilesScheduled)} profiles and ${String(result.contractsScheduled)} contracts.`,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to run retention sweep.',
        };
    }
}

export async function scheduleRetentionSweepAction(
    _previous: RetentionActionState,
    _formData: FormData,
): Promise<RetentionActionState> {
    void _previous;
    void _formData;

    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext({}, {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:admin:retention:schedule',
            action: HR_ACTION.CONFIGURE,
            resourceType: HR_RESOURCE.HR_SETTINGS,
        });
    } catch {
        return { status: 'error', message: 'Not authorized to schedule retention sweeps.' };
    }

    try {
        await scheduleNightlyRetentionSweep(
            session.authorization,
            session.authorization.correlationId,
        );
        return { status: 'success', message: 'Nightly retention sweep scheduled.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to schedule retention sweep.',
        };
    }
}
