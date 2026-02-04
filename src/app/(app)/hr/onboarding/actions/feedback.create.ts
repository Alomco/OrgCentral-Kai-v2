import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createOnboardingFeedback } from '@/server/use-cases/hr/onboarding/feedback/create-feedback';
import { buildOnboardingFeedbackDependencies } from '@/server/use-cases/hr/onboarding/feedback/feedback-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_FEEDBACK } from '@/server/repositories/cache-scopes';

const feedbackSchema = z.object({
    employeeId: z.uuid(),
    rating: z.coerce.number().min(1).max(5),
    summary: z.string().trim().max(120).optional(),
    comments: z.string().trim().max(500).optional(),
});

export async function createOnboardingFeedbackAction(formData: FormData) {
    const parsed = feedbackSchema.safeParse({
        employeeId: formData.get('employeeId'),
        rating: formData.get('rating'),
        summary: formData.get('summary') ?? undefined,
        comments: formData.get('comments') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid feedback input.' } as const;
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:feedback:create',
    });

    await createOnboardingFeedback(
        { feedbackRepository: buildOnboardingFeedbackDependencies().feedbackRepository },
        {
            authorization: session.authorization,
            employeeId: parsed.data.employeeId,
            rating: parsed.data.rating,
            summary: parsed.data.summary ?? null,
            comments: parsed.data.comments ?? null,
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_FEEDBACK,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Feedback saved.' } as const;
}
