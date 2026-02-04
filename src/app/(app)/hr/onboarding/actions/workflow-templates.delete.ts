import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateWorkflowTemplate } from '@/server/use-cases/hr/onboarding/workflows/update-workflow-template';
import { buildOnboardingWorkflowDependencies } from '@/server/use-cases/hr/onboarding/workflows/workflow-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_WORKFLOW_TEMPLATES } from '@/server/repositories/cache-scopes';

const deleteSchema = z.object({
    templateId: z.uuid(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function deleteWorkflowTemplateAction(formData: FormData): Promise<ActionResponse> {
    const parsed = deleteSchema.safeParse({ templateId: formData.get('templateId') });
    if (!parsed.success) {
        return { status: 'error', message: 'Invalid workflow template selection.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:workflow-template:delete',
    });

    await updateWorkflowTemplate(
        { workflowTemplateRepository: buildOnboardingWorkflowDependencies().workflowTemplateRepository },
        {
            authorization: session.authorization,
            templateId: parsed.data.templateId,
            updates: { isActive: false },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_WORKFLOW_TEMPLATES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Workflow template deactivated.' };
}
