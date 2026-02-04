import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateDocumentTemplate } from '@/server/use-cases/records/documents/update-document-template';
import { buildDocumentTemplateDependencies } from '@/server/use-cases/records/documents/document-template-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES } from '@/server/repositories/cache-scopes';

const deleteSchema = z.object({
    templateId: z.uuid(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function deleteDocumentTemplateAction(formData: FormData): Promise<ActionResponse> {
    const parsed = deleteSchema.safeParse({ templateId: formData.get('templateId') });
    if (!parsed.success) {
        return { status: 'error', message: 'Invalid document template selection.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:document-template:delete',
    });

    await updateDocumentTemplate(
        { documentTemplateRepository: buildDocumentTemplateDependencies().documentTemplateRepository },
        {
            authorization: session.authorization,
            templateId: parsed.data.templateId,
            updates: { isActive: false },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Document template deactivated.' };
}