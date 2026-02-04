import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createMetricDefinition } from '@/server/use-cases/hr/onboarding/metrics/create-metric-definition';
import { buildOnboardingMetricsDependencies } from '@/server/use-cases/hr/onboarding/metrics/metrics-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_METRICS } from '@/server/repositories/cache-scopes';

const metricSchema = z.object({
    key: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(120),
    unit: z.string().trim().max(40).optional(),
    targetValue: z.string().trim().optional(),
});

export async function createMetricDefinitionAction(formData: FormData) {
    const parsed = metricSchema.safeParse({
        key: formData.get('key'),
        label: formData.get('label'),
        unit: formData.get('unit') ?? undefined,
        targetValue: formData.get('targetValue') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid metric definition input.' } as const;
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:metrics:create',
    });

    const targetValue = parsed.data.targetValue ? Number(parsed.data.targetValue) : null;

    await createMetricDefinition(
        { definitionRepository: buildOnboardingMetricsDependencies().definitionRepository },
        {
            authorization: session.authorization,
            key: parsed.data.key,
            label: parsed.data.label,
            unit: parsed.data.unit ?? null,
            targetValue: Number.isNaN(targetValue) ? null : targetValue,
            isActive: true,
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_METRICS,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Metric definition created.' } as const;
}
