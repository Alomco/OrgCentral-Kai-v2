'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import { requestBreakGlassService } from '@/server/services/platform/admin/break-glass-service';
import { invalidateCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_PLATFORM_BREAK_GLASS } from '@/server/repositories/cache-scopes';
import { ValidationError } from '@/server/errors';

export interface DocumentVaultBreakGlassState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    approvalId?: string;
}

const INITIAL_STATE: DocumentVaultBreakGlassState = { status: 'idle' };

const formSchema = z.object({
    accessType: z.enum(['LIST', 'DOWNLOAD']),
    tenantId: z.uuid(),
    documentId: z.uuid().optional(),
    reason: z.string().min(8).max(500),
    expiresInMinutes: z.coerce.number().int().min(15).max(240).default(60),
}).superRefine((value, context) => {
    if (value.accessType === 'DOWNLOAD' && !value.documentId) {
        context.addIssue({
            code: 'custom',
            message: 'Document ID is required for downloads.',
            path: ['documentId'],
        });
    }
});

export async function requestDocumentVaultBreakGlassAction(
    _state: DocumentVaultBreakGlassState = INITIAL_STATE,
    formData: FormData,
): Promise<DocumentVaultBreakGlassState> {
    void _state;

    const parsed = formSchema.safeParse({
        accessType: formData.get('accessType'),
        tenantId: formData.get('tenantId'),
        documentId: formData.get('documentId'),
        reason: formData.get('reason'),
        expiresInMinutes: formData.get('expiresInMinutes') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid break-glass request details.' };
    }

    const headerStore = await headers();
    const { authorization } = await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { platformBreakGlass: ['request'] },
            auditSource: 'ui:admin:document-vault:break-glass',
        },
    );

    try {
        const action = parsed.data.accessType === 'DOWNLOAD'
            ? 'document-vault.download'
            : 'document-vault.list';
        const resourceId = parsed.data.accessType === 'DOWNLOAD'
            ? parsed.data.documentId
            : parsed.data.tenantId;

        if (!resourceId) {
            return { status: 'error', message: 'Document ID is required for downloads.' };
        }

        const result = await requestBreakGlassService(authorization, {
            scope: 'document-vault',
            reason: parsed.data.reason,
            targetOrgId: parsed.data.tenantId,
            action,
            resourceId,
            expiresInMinutes: parsed.data.expiresInMinutes,
        });

        await invalidateCache({
            orgId: authorization.orgId,
            scope: CACHE_SCOPE_PLATFORM_BREAK_GLASS,
            classification: authorization.dataClassification,
            residency: authorization.dataResidency,
        });

        revalidatePath('/admin/global/document-vault');
        return { status: 'success', message: 'Break-glass approval requested.', approvalId: result.id };
    } catch (error) {
        const message = error instanceof ValidationError ? error.message : 'Unable to request break-glass approval.';
        return { status: 'error', message };
    }
}
