import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createDocumentTemplate } from '@/server/use-cases/records/documents/create-document-template';
import { buildDocumentTemplateDependencies } from '@/server/use-cases/records/documents/document-template-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES } from '@/server/repositories/cache-scopes';
import type { DocumentType } from '@/server/types/records/document-vault';

const documentTemplateSchema = z.object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(['ONBOARDING', 'POLICY', 'CONTRACT', 'EVIDENCE', 'TRAINING', 'PERFORMANCE', 'COMPLIANCE', 'MEDICAL', 'FINANCIAL', 'SECURITY', 'OTHER']),
    templateBody: z.string().trim().min(2),
});

export async function createDocumentTemplateAction(formData: FormData) {
    const parsed = documentTemplateSchema.safeParse({
        name: formData.get('name'),
        type: formData.get('type'),
        templateBody: formData.get('templateBody'),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid document template input.' } as const;
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:document-template:create',
    });

    await createDocumentTemplate(
        { documentTemplateRepository: buildDocumentTemplateDependencies().documentTemplateRepository },
        {
            authorization: session.authorization,
            name: parsed.data.name,
            type: parsed.data.type as DocumentType,
            templateBody: parsed.data.templateBody,
            isActive: true,
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Document template created.' } as const;
}
