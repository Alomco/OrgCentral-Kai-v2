'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { updateComplianceItem } from '@/server/use-cases/hr/compliance/update-compliance-item';
import { normalizeString } from '@/server/use-cases/shared/normalizers';
import { complianceAttachmentsSchema } from '@/server/validators/hr/compliance/compliance-validators';
import type { ComplianceAttachmentInput } from '@/server/types/compliance-types';

const reviewComplianceItemFormSchema = z.object({
    userId: z.uuid(),
    itemId: z.uuid(),
    decision: z.enum(['approve', 'reject']),
    notes: z.string().max(2000).optional(),
    attachments: z.string().optional(),
    completedAt: z.string().optional(),
});

function parseAttachments(value: string | undefined): ComplianceAttachmentInput[] | undefined {
    if (!value) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(value);
        const validated = complianceAttachmentsSchema.safeParse(parsed);
        if (!validated.success) {
            return undefined;
        }
        return validated.data;
    } catch {
        return undefined;
    }
}

function parseCompletedAt(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function reviewComplianceItemAction(formData: FormData): Promise<void> {
    const notesRaw = formData.get('notes');
    const notesValue = typeof notesRaw === 'string' ? notesRaw : undefined;

    const parsed = reviewComplianceItemFormSchema.safeParse({
        userId: formData.get('userId'),
        itemId: formData.get('itemId'),
        decision: formData.get('decision'),
        notes: notesValue,
        attachments: formData.get('attachments'),
        completedAt: formData.get('completedAt'),
    });

    if (!parsed.success) {
        redirect('/hr/compliance');
    }

    const headerStore = await headers();
    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:hr:compliance:review',
            action: 'update',
            resourceType: 'hr.compliance',
            resourceAttributes: {
                targetUserId: parsed.data.userId,
                itemId: parsed.data.itemId,
                decision: parsed.data.decision,
                notesLength: normalizeString(parsed.data.notes)?.length ?? 0,
            },
        },
    );

    const normalizedNotes = normalizeString(parsed.data.notes);

    const attachments = parseAttachments(parsed.data.attachments);
    const completedAt = parseCompletedAt(parsed.data.completedAt) ?? new Date();

    await updateComplianceItem(
        { complianceItemRepository: new PrismaComplianceItemRepository() },
        {
            authorization,
            userId: parsed.data.userId,
            itemId: parsed.data.itemId,
            updates:
                parsed.data.decision === 'approve'
                    ? {
                        status: 'COMPLETE',
                        attachments,
                        completedAt,
                        reviewedBy: authorization.userId,
                        reviewedAt: new Date(),
                    }
                    : {
                        status: 'MISSING',
                        notes: normalizedNotes ?? undefined,
                        reviewedBy: authorization.userId,
                        reviewedAt: new Date(),
                    },
        },
    );

    redirect('/hr/compliance');
}
