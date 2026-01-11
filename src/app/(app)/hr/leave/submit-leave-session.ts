'use server';

import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { HR_ACTION, HR_RESOURCE } from '@/server/security/authorization/hr-resource-registry';

import type { LeaveRequestFormState } from './form-state';
import type { SessionContext } from './submit-leave-types';

interface SessionResultOk {
    kind: 'ok';
    session: SessionContext;
}

interface SessionResultError {
    kind: 'error';
    state: LeaveRequestFormState;
}

type SessionResult = SessionResultOk | SessionResultError;

export async function resolveSession(previous: LeaveRequestFormState): Promise<SessionResult> {
    try {
        const headerStore = await headers();
        const session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'ui:hr:leave:submit',
                action: HR_ACTION.CREATE,
                resourceType: HR_RESOURCE.HR_LEAVE,
                resourceAttributes: { scope: 'self' },
            },
        );

        return { kind: 'ok', session };
    } catch {
        return {
            kind: 'error',
            state: {
                status: 'error',
                message: 'Not authorized to submit leave requests.',
                values: previous.values,
            },
        };
    }
}
