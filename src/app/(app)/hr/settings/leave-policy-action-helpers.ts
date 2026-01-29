'use server';

import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';

type LeavePolicyAction = 'create' | 'update' | 'delete' | 'list';

export async function getLeavePolicySession(action: LeavePolicyAction) {
    try {
        const headerStore = await headers();
        return await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: `ui:hr:leave-policies:${action}`,
            },
        );
    } catch {
        return null;
    }
}
