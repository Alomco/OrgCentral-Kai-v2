import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createWorkflowTemplate } from '@/server/use-cases/hr/onboarding/workflows/create-workflow-template';
import { buildOnboardingWorkflowDependencies } from '@/server/use-cases/hr/onboarding/workflows/workflow-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_WORKFLOW_TEMPLATES } from '@/server/repositories/cache-scopes';
import type { JsonValue } from '@/server/types/json';

const workflowTemplateSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(240).optional(),
    templateType: z.enum(['ONBOARDING', 'OFFBOARDING']).default('ONBOARDING'),
    definition: z.string().trim().min(2),
});

export async function createWorkflowTemplateAction(formData: FormData) {
    const parsed = workflowTemplateSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        templateType: formData.get('templateType'),
        definition: formData.get('definition'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid workflow template input.' } as const;
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:workflow-template:create',
    });

    const definition = parseJsonValue(parsed.data.definition);
    if (!definition) {
        return { status: 'error', message: 'Workflow definition must be valid JSON.' } as const;
    }
    await createWorkflowTemplate(
        { workflowTemplateRepository: buildOnboardingWorkflowDependencies().workflowTemplateRepository },
        {
            authorization: session.authorization,
            name: parsed.data.name,
            description: parsed.data.description ?? null,
            templateType: parsed.data.templateType,
            definition,
            isActive: true,
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_WORKFLOW_TEMPLATES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Workflow template created.' } as const;
}

function parseJsonValue(raw: string): JsonValue | null {
    try {
        const parsed = JSON.parse(raw) as JsonValue;
        return isJsonValue(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function isJsonValue(value: JsonValue): value is JsonValue {
    if (value === null) {
        return true;
    }
    if (['string', 'number', 'boolean'].includes(typeof value)) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every((item) => isJsonValue(item));
    }
    if (typeof value === 'object') {
        return Object.values(value).every((item) => isJsonValue(item as JsonValue));
    }
    return false;
}
