import type { ComplianceLogItem } from '@/server/types/compliance-types';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { registerComplianceItemsCache } from './shared/cache-helpers';

const DEFAULT_TAKE = 100;
const MAX_TAKE = 500;

export interface ListPendingReviewComplianceItemsInput {
    authorization: RepositoryAuthorizationContext;
    take?: number;
}

export interface ListPendingReviewComplianceItemsDependencies {
    complianceItemRepository: IComplianceItemRepository;
}

export async function listPendingReviewComplianceItems(
    deps: ListPendingReviewComplianceItemsDependencies,
    input: ListPendingReviewComplianceItemsInput,
): Promise<ComplianceLogItem[]> {
    registerComplianceItemsCache(input.authorization);

    const take = input.take ?? DEFAULT_TAKE;
    const safeTake = Number.isFinite(take) ? Math.max(1, Math.min(MAX_TAKE, take)) : DEFAULT_TAKE;

    return deps.complianceItemRepository.listPendingReviewItemsForOrg(input.authorization.orgId, safeTake);
}
