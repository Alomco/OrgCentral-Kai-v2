'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';

const complianceItemRepository = new PrismaComplianceItemRepository();

const complianceItemDetailSchema = z.object({
    itemId: z.uuid(),
    userId: z.uuid().optional(),
});

export async function getComplianceItemDetailAction(input: {
    itemId: string;
    userId?: string;
}): Promise<{ item: Awaited<ReturnType<typeof complianceItemRepository.getItem>> | null }> {
    const parsed = complianceItemDetailSchema.safeParse(input);
    if (!parsed.success) {
        return { item: null };
    }

    const headerStore = await headers();
    const baseSession = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'ui:hr:compliance:detail',
            action: 'read',
            resourceType: 'hr.compliance',
            resourceAttributes: { itemId: parsed.data.itemId },
        },
    );

    const requestedUserId = parsed.data.userId;
    if (requestedUserId && requestedUserId !== baseSession.authorization.userId) {
        const elevatedSession = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['read'] },
                auditSource: 'ui:hr:compliance:detail.elevated',
                action: 'read',
                resourceType: 'hr.compliance',
                resourceAttributes: { itemId: parsed.data.itemId, targetUserId: requestedUserId },
            },
        );

        const item = await complianceItemRepository.getItem(
            elevatedSession.authorization.orgId,
            requestedUserId,
            parsed.data.itemId,
        );

        return { item };
    }

    const targetUserId = baseSession.authorization.userId;
    const item = await complianceItemRepository.getItem(
        baseSession.authorization.orgId,
        targetUserId,
        parsed.data.itemId,
    );

    return { item };
}
