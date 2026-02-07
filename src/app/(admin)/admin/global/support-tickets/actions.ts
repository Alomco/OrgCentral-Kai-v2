'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { createSupportTicketService, updateSupportTicketService } from '@/server/services/platform/admin/support-ticket-service';
import { invalidateCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PLATFORM_SUPPORT } from '@/server/repositories/cache-scopes';
import { ValidationError } from '@/server/errors';
import { parseSupportTicketCreate, parseSupportTicketUpdate } from '@/server/validators/platform/admin/support-ticket-validators';

export interface SupportTicketActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

const INITIAL_STATE: SupportTicketActionState = { status: 'idle' };

export async function createSupportTicketAction(
    _state: SupportTicketActionState = INITIAL_STATE,
    formData: FormData,
): Promise<SupportTicketActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformSupport: ['create'] },
            auditSource: 'ui:admin:support:create',
        },
    );

    try {
        const requesterNameValue = readFormString(formData, 'requesterName');
        const payload = parseSupportTicketCreate({
            tenantId: readFormString(formData, 'tenantId'),
            requesterEmail: readFormString(formData, 'requesterEmail'),
            ...(requesterNameValue ? { requesterName: requesterNameValue } : {}),
            subject: readFormString(formData, 'subject'),
            description: readFormString(formData, 'description'),
            severity: readFormString(formData, 'severity') || 'LOW',
            tags: parseCommaList(readFormString(formData, 'tags')),
        });

        await createSupportTicketService(authorization, payload);

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_SUPPORT,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/support-tickets');
        return { status: 'success', message: 'Support ticket created.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to create ticket.';
        return { status: 'error', message };
    }
}

export async function updateSupportTicketAction(
    _state: SupportTicketActionState = INITIAL_STATE,
    formData: FormData,
): Promise<SupportTicketActionState> {
    void _state;
    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformSupport: ['update'] },
            auditSource: 'ui:admin:support:update',
        },
    );

    try {
        const assignedToValue = readFormString(formData, 'assignedTo');
        const statusValue = readFormString(formData, 'status');
        const payload = parseSupportTicketUpdate({
            ticketId: readFormString(formData, 'ticketId'),
            ...(statusValue ? { status: statusValue } : {}),
            ...(assignedToValue ? { assignedTo: assignedToValue } : {}),
        });

        await updateSupportTicketService(authorization, payload);

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_SUPPORT,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/support-tickets');
        return { status: 'success', message: 'Support ticket updated.' };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to update ticket.';
        return { status: 'error', message };
    }
}

function readFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function parseCommaList(value: string): string[] {
    if (!value) {
        return [];
    }
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
