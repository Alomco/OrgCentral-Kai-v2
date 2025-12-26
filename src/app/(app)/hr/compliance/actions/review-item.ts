'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { updateComplianceItem } from '@/server/use-cases/hr/compliance/update-compliance-item';
import { normalizeString } from '@/server/use-cases/shared/normalizers';

const reviewComplianceItemFormSchema = z.object({
    userId: z.uuid(),
    itemId: z.uuid(),
    decision: z.enum(['approve', 'reject']),
    notes: z.string().max(2000).optional(),
});

export async function reviewComplianceItemAction(formData: FormData): Promise<void> {
    const notesRaw = formData.get('notes');
    const notesValue = typeof notesRaw === 'string' ? notesRaw : undefined;

    const parsed = reviewComplianceItemFormSchema.safeParse({
        userId: formData.get('userId'),
        itemId: formData.get('itemId'),
        decision: formData.get('decision'),
        notes: notesValue,
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
