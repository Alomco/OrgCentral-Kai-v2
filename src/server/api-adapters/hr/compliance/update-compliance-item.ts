import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import {
    updateComplianceItem,
    type UpdateComplianceItemDependencies,
} from '@/server/use-cases/hr/compliance/update-compliance-item';
import type { UpdateComplianceItemInput } from '@/server/use-cases/hr/compliance/update-compliance-item';
import { updateComplianceItemSchema } from '@/server/types/hr-compliance-schemas';
import type { ComplianceControllerDependencies } from './common';
import { resolveComplianceControllerDependencies, readJson } from './common';

export interface UpdateComplianceItemControllerResult {
    success: true;
    itemId: string;
}

export async function updateComplianceItemController(
    request: Request,
    dependencies?: ComplianceControllerDependencies,
): Promise<UpdateComplianceItemControllerResult> {
    const payload = updateComplianceItemSchema.parse(await readJson(request));
    const { session, complianceItemRepository, complianceTemplateRepository } = resolveComplianceControllerDependencies(dependencies);

    const baseAccess = await getSessionContext(session, {
        headers: request.headers,
        requiredPermissions: { employeeProfile: ['read'] },
        auditSource: 'api:hr:compliance:update',
        action: 'update',
        resourceType: 'hr.compliance',
        resourceAttributes: {
            itemId: payload.itemId,
            targetUserId: payload.userId,
        },
    });

    let authorization = baseAccess.authorization;
    let authSession = baseAccess.session;

    if (payload.userId !== authorization.userId) {
        const elevated = await getSessionContext(session, {
            headers: request.headers,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'api:hr:compliance:update.elevated',
            action: 'update',
            resourceType: 'hr.compliance',
            resourceAttributes: {
                itemId: payload.itemId,
                targetUserId: payload.userId,
            },
        });
        authorization = elevated.authorization;
        authSession = elevated.session;
    }

    const updates: typeof payload.updates & { reviewedBy?: string; reviewedAt?: Date } = {
        ...payload.updates,
    };
    const actorId = authSession.session.userId;
    if (actorId !== payload.userId) {
        updates.reviewedBy = actorId;
        updates.reviewedAt = new Date();
    }

    const useCaseDeps: UpdateComplianceItemDependencies = { complianceItemRepository, complianceTemplateRepository };
    const normalizedAttachments = payload.updates.attachments ?? undefined;
    const useCaseUpdates: UpdateComplianceItemInput['updates'] = {
        status: updates.status,
        notes: updates.notes ?? undefined,
        attachments: normalizedAttachments,
        completedAt: updates.completedAt ?? undefined,
        dueDate: updates.dueDate ?? undefined,
        reviewedBy: updates.reviewedBy ?? undefined,
        reviewedAt: updates.reviewedAt ?? undefined,
        metadata: updates.metadata,
    };

    await updateComplianceItem(useCaseDeps, {
        authorization,
        userId: payload.userId,
        itemId: payload.itemId,
        updates: useCaseUpdates,
    });

    return {
        success: true,
        itemId: payload.itemId,
    };
}
