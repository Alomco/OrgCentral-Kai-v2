import type { ComplianceLogItem } from '@/server/types/compliance-types';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { registerComplianceItemsCache } from './shared/cache-helpers';

export interface ListComplianceItemsInput {
    authorization: RepositoryAuthorizationContext;
    userId: string;
}

export interface ListComplianceItemsDependencies {
    complianceItemRepository: IComplianceItemRepository;
}

export async function listComplianceItems(
    deps: ListComplianceItemsDependencies,
    input: ListComplianceItemsInput,
): Promise<ComplianceLogItem[]> {
    assertNonEmpty(input.userId, 'userId');
    registerComplianceItemsCache(input.authorization);
    return deps.complianceItemRepository.listItemsForUser(input.authorization.orgId, input.userId);
}
