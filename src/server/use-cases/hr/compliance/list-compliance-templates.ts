import type { ComplianceTemplate } from '@/server/types/compliance-types';
import type { IComplianceTemplateRepository } from '@/server/repositories/contracts/hr/compliance/compliance-template-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

export interface ListComplianceTemplatesInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListComplianceTemplatesDependencies {
    complianceTemplateRepository: IComplianceTemplateRepository;
}

export async function listComplianceTemplates(
    deps: ListComplianceTemplatesDependencies,
    input: ListComplianceTemplatesInput,
): Promise<ComplianceTemplate[]> {
    return deps.complianceTemplateRepository.listTemplates(input.authorization.orgId);
}
