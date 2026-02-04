import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmailSequenceTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type { EmailSequenceTemplateRecord, EmailSequenceTrigger } from '@/server/types/hr/onboarding-email-sequences';
import type { JsonValue } from '@/server/types/json';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface CreateEmailSequenceTemplateInput {
    authorization: RepositoryAuthorizationContext;
    name: string;
    description?: string | null;
    trigger: EmailSequenceTrigger;
    steps: JsonValue;
    isActive?: boolean;
}

export interface CreateEmailSequenceTemplateDependencies {
    templateRepository: IEmailSequenceTemplateRepository;
}

export interface CreateEmailSequenceTemplateResult {
    template: EmailSequenceTemplateRecord;
}

export async function createEmailSequenceTemplate(
    deps: CreateEmailSequenceTemplateDependencies,
    input: CreateEmailSequenceTemplateInput,
): Promise<CreateEmailSequenceTemplateResult> {
    assertOnboardingConfigManager(input.authorization);

    const template = await deps.templateRepository.createTemplate({
        orgId: input.authorization.orgId,
        name: input.name.trim(),
        description: input.description ?? null,
        trigger: input.trigger,
        steps: input.steps,
        isActive: input.isActive,
        metadata: null,
        dataClassification: input.authorization.dataClassification,
        residencyTag: input.authorization.dataResidency,
        auditSource: input.authorization.auditSource,
        correlationId: input.authorization.correlationId,
        createdBy: input.authorization.userId,
    });

    return { template };
}
