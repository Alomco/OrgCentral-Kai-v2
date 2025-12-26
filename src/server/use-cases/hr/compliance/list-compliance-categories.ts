import type { ComplianceCategory } from '@/server/types/compliance-types';
import type { IComplianceCategoryRepository } from '@/server/repositories/contracts/hr/compliance/compliance-category-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export interface ListComplianceCategoriesInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListComplianceCategoriesDependencies {
    complianceCategoryRepository: IComplianceCategoryRepository;
}

export async function listComplianceCategories(
    deps: ListComplianceCategoriesDependencies,
    input: ListComplianceCategoriesInput,
): Promise<ComplianceCategory[]> {
    return deps.complianceCategoryRepository.listCategories(input.authorization.orgId);
}
