import type { Prisma } from '@prisma/client';
import type { ComplianceLogItem } from '@/server/types/compliance-types';
import type {
    ComplianceItemUpdateInput,
    IComplianceItemRepository,
} from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { invalidateComplianceItemsCache } from './shared/cache-helpers';

export interface UpdateComplianceItemInput {
    authorization: RepositoryAuthorizationContext;
    userId: string;
    itemId: string;
    updates: {
        status?: ComplianceLogItem['status'];
        notes?: string | null;
        attachments?: string[] | null;
        completedAt?: Date | null;
        dueDate?: Date | null;
        reviewedBy?: string | null;
        reviewedAt?: Date | null;
        metadata?: Record<string, unknown>;
    };
}

export interface UpdateComplianceItemDependencies {
    complianceItemRepository: IComplianceItemRepository;
}

export async function updateComplianceItem(
    deps: UpdateComplianceItemDependencies,
    input: UpdateComplianceItemInput,
): Promise<ComplianceLogItem> {
    assertNonEmpty(input.userId, 'userId');
    assertNonEmpty(input.itemId, 'itemId');

    const payload: ComplianceItemUpdateInput = {
        status: input.updates.status,
        notes: input.updates.notes,
        attachments: input.updates.attachments ?? undefined,
        completedAt: input.updates.completedAt ?? undefined,
        dueDate: input.updates.dueDate ?? undefined,
        reviewedBy: input.updates.reviewedBy ?? undefined,
        reviewedAt: input.updates.reviewedAt ?? undefined,
        metadata: input.updates.metadata as Prisma.JsonValue | undefined,
    };

    const result = await deps.complianceItemRepository.updateItem(
        input.authorization.orgId,
        input.userId,
        input.itemId,
        payload,
    );

    await invalidateComplianceItemsCache(input.authorization);
    return result;
}
