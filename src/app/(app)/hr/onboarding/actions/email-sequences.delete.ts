import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateEmailSequenceTemplate } from '@/server/use-cases/hr/onboarding/email-sequences/update-email-sequence-template';
import { buildEmailSequenceDependencies } from '@/server/use-cases/hr/onboarding/email-sequences/sequence-repository-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES } from '@/server/repositories/cache-scopes';

const deleteSchema = z.object({
    templateId: z.uuid(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function deleteEmailSequenceTemplateAction(formData: FormData): Promise<ActionResponse> {
    const parsed = deleteSchema.safeParse({ templateId: formData.get('templateId') });
    if (!parsed.success) {
        return { status: 'error', message: 'Invalid email sequence selection.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:email-sequence:delete',
    });

    await updateEmailSequenceTemplate(
        { templateRepository: buildEmailSequenceDependencies().templateRepository },
        {
            authorization: session.authorization,
            templateId: parsed.data.templateId,
            updates: { isActive: false },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_EMAIL_SEQUENCES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Email sequence deactivated.' };
}
