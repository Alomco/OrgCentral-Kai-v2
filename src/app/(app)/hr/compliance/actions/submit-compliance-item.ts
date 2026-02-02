'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateComplianceItem } from '@/server/use-cases/hr/compliance/update-compliance-item';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { normalizeString } from '@/server/use-cases/shared/normalizers';
import { complianceAttachmentsSchema } from '@/server/validators/hr/compliance/compliance-validators';
import { jsonValueSchema } from '@/server/types/notification-dispatch';
import type { ComplianceAttachmentInput } from '@/server/types/compliance-types';

export interface ComplianceSubmissionActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
}

const submissionSchema = z.object({
    userId: z.uuid(),
    itemId: z.uuid(),
    notes: z.string().max(4000).optional(),
    completedAt: z.string().optional(),
    attachments: z.string().optional(),
    metadata: z.string().optional(),
});

function parseAttachments(raw: string | undefined): ComplianceAttachmentInput[] | null | undefined {
    if (!raw) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(raw);
        const validated = complianceAttachmentsSchema.safeParse(parsed);
        if (!validated.success) {
            return undefined;
        }
        return validated.data;
    } catch {
        return undefined;
    }
}

function parseCompletedAt(raw: string | undefined): Date | null | undefined {
    if (!raw) {
        return undefined;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseMetadata(raw: string | undefined) {
    if (!raw) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(raw);
        const validated = jsonValueSchema.safeParse(parsed);
        return validated.success ? validated.data : undefined;
    } catch {
        return undefined;
    }
}

export async function submitComplianceItemAction(
    _previous: ComplianceSubmissionActionState,
    formData: FormData,
): Promise<ComplianceSubmissionActionState> {
    const parsed = submissionSchema.safeParse({
        userId: formData.get('userId'),
        itemId: formData.get('itemId'),
        notes: formData.get('notes'),
        completedAt: formData.get('completedAt'),
        attachments: formData.get('attachments'),
        metadata: formData.get('metadata'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid submission payload.' };
    }

    const headerStore = await headers();
    const baseAccess = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:compliance:submission',
            action: 'update',
            resourceType: 'hr.compliance',
            resourceAttributes: {
                targetUserId: parsed.data.userId,
                itemId: parsed.data.itemId,
            },
        },
    );

    let authorization = baseAccess.authorization;
    if (parsed.data.userId !== authorization.userId) {
        const elevated = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:compliance:submission.elevated',
                action: 'update',
                resourceType: 'hr.compliance',
                resourceAttributes: {
                    targetUserId: parsed.data.userId,
                    itemId: parsed.data.itemId,
                },
            },
        );
        authorization = elevated.authorization;
    }

    const normalizedNotes = normalizeString(parsed.data.notes);
    const attachments = parseAttachments(parsed.data.attachments);
    const metadata = parseMetadata(parsed.data.metadata);
    const completedAt = parseCompletedAt(parsed.data.completedAt);

    try {
        await updateComplianceItem(
            { complianceItemRepository: new PrismaComplianceItemRepository() },
            {
                authorization,
                userId: parsed.data.userId,
                itemId: parsed.data.itemId,
                updates: {
                    status: 'PENDING_REVIEW',
                    notes: normalizedNotes ?? null,
                    attachments: attachments ?? null,
                    completedAt: completedAt ?? null,
                    metadata,
                },
            },
        );
        return { status: 'success', message: 'Submission sent for review.' };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update compliance item.',
        };
    }
}
