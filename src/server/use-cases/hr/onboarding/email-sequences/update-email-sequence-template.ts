import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmailSequenceTemplateRepository } from '@/server/repositories/contracts/hr/onboarding/email-sequence-repository-contract';
import type { EmailSequenceTemplateRecord, EmailSequenceTrigger } from '@/server/types/hr/onboarding-email-sequences';
import type { JsonValue } from '@/server/types/json';
import { assertOnboardingConfigManager } from '../config/onboarding-config-access';

export interface UpdateEmailSequenceTemplateInput {
    authorization: RepositoryAuthorizationContext;
    templateId: string;
    updates: {
        name?: string;
        description?: string | null;
        trigger?: EmailSequenceTrigger;
        steps?: JsonValue;
        isActive?: boolean;
    };
}

export interface UpdateEmailSequenceTemplateDependencies {
    templateRepository: IEmailSequenceTemplateRepository;
}

export interface UpdateEmailSequenceTemplateResult {
    template: EmailSequenceTemplateRecord;
}

export async function updateEmailSequenceTemplate(
    deps: UpdateEmailSequenceTemplateDependencies,
    input: UpdateEmailSequenceTemplateInput,
): Promise<UpdateEmailSequenceTemplateResult> {
    assertOnboardingConfigManager(input.authorization);

    const template = await deps.templateRepository.updateTemplate(
        input.authorization.orgId,
        input.templateId,
        {
            name: input.updates.name?.trim(),
            description: input.updates.description ?? undefined,
            trigger: input.updates.trigger,
            steps: input.updates.steps,
            isActive: input.updates.isActive,
            updatedBy: input.authorization.userId,
        },
    );

    return { template };
}
