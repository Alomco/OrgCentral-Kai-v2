import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IDocumentTemplateRepository } from '@/server/repositories/contracts/records/document-template-repository-contract';
import type { DocumentType } from '@/server/types/records/document-vault';
import type { DocumentTemplateRecord } from '@/server/types/records/document-templates';
import type { JsonValue } from '@/server/types/json';
import { assertOnboardingConfigManager } from '@/server/use-cases/hr/onboarding/config/onboarding-config-access';

export interface UpdateDocumentTemplateInput {
    authorization: RepositoryAuthorizationContext;
    templateId: string;
    updates: {
        name?: string;
        type?: DocumentType;
        templateBody?: string;
        templateSchema?: JsonValue | null;
        version?: number;
        isActive?: boolean;
    };
}

export interface UpdateDocumentTemplateDependencies {
    documentTemplateRepository: IDocumentTemplateRepository;
}

export interface UpdateDocumentTemplateResult {
    template: DocumentTemplateRecord;
}

export async function updateDocumentTemplate(
    deps: UpdateDocumentTemplateDependencies,
    input: UpdateDocumentTemplateInput,
): Promise<UpdateDocumentTemplateResult> {
    assertOnboardingConfigManager(input.authorization);

    const template = await deps.documentTemplateRepository.updateTemplate(
        input.authorization.orgId,
        input.templateId,
        {
            name: input.updates.name?.trim(),
            type: input.updates.type,
            templateBody: input.updates.templateBody,
            templateSchema: input.updates.templateSchema ?? undefined,
            version: input.updates.version,
            isActive: input.updates.isActive,
        },
    );

    return { template };
}
