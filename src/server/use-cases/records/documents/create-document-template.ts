import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IDocumentTemplateRepository } from '@/server/repositories/contracts/records/document-template-repository-contract';
import type { DocumentType } from '@/server/types/records/document-vault';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import type { JsonValue } from '@/server/types/json';
import { assertOnboardingConfigManager } from '@/server/use-cases/hr/onboarding/config/onboarding-config-access';

export interface CreateDocumentTemplateInput {
    authorization: RepositoryAuthorizationContext;
    name: string;
    type: DocumentType;
    templateBody: string;
    templateSchema?: JsonValue | null;
    isActive?: boolean;
}

export interface CreateDocumentTemplateDependencies {
    documentTemplateRepository: IDocumentTemplateRepository;
}

export interface CreateDocumentTemplateResult {
    template: DocumentTemplateRecord;
}

export async function createDocumentTemplate(
    deps: CreateDocumentTemplateDependencies,
    input: CreateDocumentTemplateInput,
): Promise<CreateDocumentTemplateResult> {
    assertOnboardingConfigManager(input.authorization);

    const template = await deps.documentTemplateRepository.createTemplate({
        orgId: input.authorization.orgId,
        name: input.name.trim(),
        type: input.type,
        templateBody: input.templateBody,
        templateSchema: input.templateSchema ?? null,
        isActive: input.isActive,
        metadata: null,
        dataClassification: input.authorization.dataClassification,
        residencyTag: input.authorization.dataResidency,
    });

    return { template };
}
