import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IDocumentTemplateRepository } from '@/server/repositories/contracts/records/document-template-repository-contract';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import type { DocumentType } from '@/server/types/records/document-vault';
import { assertOnboardingConfigManager } from '@/server/use-cases/hr/onboarding/config/onboarding-config-access';

export interface ListDocumentTemplatesInput {
    authorization: RepositoryAuthorizationContext;
    isActive?: boolean;
    type?: DocumentType;
}

export interface ListDocumentTemplatesDependencies {
    documentTemplateRepository: IDocumentTemplateRepository;
}

export interface ListDocumentTemplatesResult {
    templates: DocumentTemplateRecord[];
}

export async function listDocumentTemplates(
    deps: ListDocumentTemplatesDependencies,
    input: ListDocumentTemplatesInput,
): Promise<ListDocumentTemplatesResult> {
    assertOnboardingConfigManager(input.authorization);
    const templates = await deps.documentTemplateRepository.listTemplates(input.authorization.orgId, {
        isActive: input.isActive,
        type: input.type,
    });
    return { templates };
}
