import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateMetricDefinition } from '@/server/use-cases/hr/onboarding/metrics/update-metric-definition';
import { buildOnboardingMetricsDependencies } from '@/server/use-cases/hr/onboarding/metrics/metrics-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_METRICS } from '@/server/repositories/cache-scopes';

const metricSchema = z.object({
    definitionId: z.uuid(),
    label: z.string().trim().min(1).max(120),
    unit: z.string().trim().max(40).optional(),
    targetValue: z.string().trim().optional(),
    isActive: z.string().optional(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function updateMetricDefinitionAction(formData: FormData): Promise<ActionResponse> {
    const parsed = metricSchema.safeParse({
        definitionId: formData.get('definitionId'),
        label: formData.get('label'),
        unit: formData.get('unit') ?? undefined,
        targetValue: formData.get('targetValue') ?? undefined,
        isActive: formData.get('isActive') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid metric definition input.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:metrics:update',
    });

    const targetValue = parsed.data.targetValue ? Number(parsed.data.targetValue) : null;

    await updateMetricDefinition(
        { definitionRepository: buildOnboardingMetricsDependencies().definitionRepository },
        {
            authorization: session.authorization,
            definitionId: parsed.data.definitionId,
            updates: {
                label: parsed.data.label,
                unit: parsed.data.unit ?? null,
                targetValue: Number.isNaN(targetValue) ? null : targetValue,
                isActive: parseBoolean(parsed.data.isActive) ?? undefined,
            },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_METRICS,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Metric definition updated.' };
}

function parseBoolean(value?: string): boolean | null {
    if (!value) {
        return null;
    }
    if (value === 'true' || value === 'on') {
        return true;
    }
    if (value === 'false' || value === 'off') {
        return false;
    }
    return null;
}