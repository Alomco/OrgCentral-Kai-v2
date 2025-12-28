import { registerOrgCacheTag } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_COMPLIANCE_STATUS } from '@/server/repositories/cache-scopes';
import type { IComplianceStatusRepository } from '@/server/repositories/contracts/hr/compliance/compliance-status-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export interface GetComplianceStatusInput {
  authorization: RepositoryAuthorizationContext;
  userId: string;
}

export interface GetComplianceStatusDependencies {
  complianceStatusRepository: IComplianceStatusRepository;
}

export async function getComplianceStatus(
  deps: GetComplianceStatusDependencies,
  input: GetComplianceStatusInput,
) {
  const snapshot = await deps.complianceStatusRepository.recalculateForUser(
    input.authorization.orgId,
    input.userId,
  );

  registerOrgCacheTag(
    input.authorization.orgId,
    CACHE_SCOPE_COMPLIANCE_STATUS,
    input.authorization.dataClassification,
    input.authorization.dataResidency,
  );

  return snapshot;
}
