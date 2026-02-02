import type { PrismaJsonValue } from '@/server/types/prisma';
import type { ComplianceAttachmentInput, ComplianceLogItem } from '@/server/types/compliance-types';
import type { JsonValue } from '@/server/types/json';
import type {
    ComplianceItemUpdateInput,
    IComplianceItemRepository,
} from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { invalidateComplianceItemsCache } from './shared/cache-helpers';
import { addDays } from 'date-fns';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface UpdateComplianceItemInput {
    authorization: RepositoryAuthorizationContext;
    userId: string;
    itemId: string;
    updates: {
        status?: ComplianceLogItem['status'];
        notes?: string | null;
        attachments?: ComplianceAttachmentInput[] | null;
        completedAt?: Date | null;
        dueDate?: Date | null;
        reviewedBy?: string | null;
        reviewedAt?: Date | null;
        metadata?: JsonValue;
    };
}

export interface UpdateComplianceItemDependencies {
    complianceItemRepository: IComplianceItemRepository;
    complianceTemplateRepository?: IComplianceTemplateRepository;
}

export async function updateComplianceItem(
    deps: UpdateComplianceItemDependencies,
    input: UpdateComplianceItemInput,
): Promise<ComplianceLogItem> {
    assertNonEmpty(input.userId, 'userId');
    assertNonEmpty(input.itemId, 'itemId');

    const computedDueDate = await maybeComputeDueDateFromTemplateExpiry(deps, input);

    const payload: ComplianceItemUpdateInput = {
        status: input.updates.status,
        notes: input.updates.notes,
        attachments: input.updates.attachments ?? undefined,
        completedAt: input.updates.completedAt ?? undefined,
        dueDate: input.updates.dueDate ?? undefined,
        reviewedBy: input.updates.reviewedBy ?? undefined,
        reviewedAt: input.updates.reviewedAt ?? undefined,
        metadata: input.updates.metadata as PrismaJsonValue | undefined,
    };

    if (payload.dueDate === undefined && computedDueDate) {
        payload.dueDate = computedDueDate;
    }

    const result = await deps.complianceItemRepository.updateItem(
        input.authorization.orgId,
        input.userId,
        input.itemId,
        payload,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'hr.compliance.item.updated',
        resource: 'hr.compliance.item',
        resourceId: result.id,
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        payload: {
            targetUserId: result.userId,
            templateItemId: result.templateItemId,
            status: result.status,
            completedAt: result.completedAt ?? null,
            reviewedAt: result.reviewedAt ?? null,
            dueDate: result.dueDate ?? null,
        },
    });

    await invalidateComplianceItemsCache(input.authorization);
    return result;
}

async function maybeComputeDueDateFromTemplateExpiry(
    deps: UpdateComplianceItemDependencies,
    input: UpdateComplianceItemInput,
): Promise<Date | undefined> {
    if (input.updates.dueDate !== undefined) {
        return undefined;
    }
    if (!deps.complianceTemplateRepository) {
        return undefined;
    }

    const completedAt = input.updates.completedAt;
    if (!(completedAt instanceof Date)) {
        return undefined;
    }

    const existing = await deps.complianceItemRepository.getItem(
        input.authorization.orgId,
        input.userId,
        input.itemId,
    );
    const templateItemId = existing?.templateItemId;
    if (!templateItemId) {
        return undefined;
    }

    const templates = await deps.complianceTemplateRepository.listTemplates(input.authorization.orgId);
    const templateItem = templates
        .flatMap((template) => template.items)
        .find((item) => item.id === templateItemId);

    const expiryDurationDays = templateItem?.expiryDurationDays;
    if (typeof expiryDurationDays !== 'number' || !Number.isFinite(expiryDurationDays) || expiryDurationDays <= 0) {
        return undefined;
    }

    const safeDays = Math.min(3650, Math.max(1, Math.floor(expiryDurationDays)));
    return addDays(completedAt, safeDays);
}
