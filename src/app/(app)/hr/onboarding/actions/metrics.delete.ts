import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateMetricDefinition } from '@/server/use-cases/hr/onboarding/metrics/update-metric-definition';
import { buildOnboardingMetricsDependencies } from '@/server/use-cases/hr/onboarding/metrics/metrics-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_METRICS } from '@/server/repositories/cache-scopes';

const deleteSchema = z.object({
    definitionId: z.uuid(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function deleteMetricDefinitionAction(formData: FormData): Promise<ActionResponse> {
    const parsed = deleteSchema.safeParse({ definitionId: formData.get('definitionId') });
    if (!parsed.success) {
        return { status: 'error', message: 'Invalid metric definition selection.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:metrics:delete',
    });

    await updateMetricDefinition(
        { definitionRepository: buildOnboardingMetricsDependencies().definitionRepository },
        {
            authorization: session.authorization,
            definitionId: parsed.data.definitionId,
            updates: { isActive: false },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_METRICS,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Metric definition deactivated.' };
}