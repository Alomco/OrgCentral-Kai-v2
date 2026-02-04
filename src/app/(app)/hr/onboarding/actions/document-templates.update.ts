import { z } from 'zod';
import { headers } from 'next/headers';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateDocumentTemplate } from '@/server/use-cases/records/documents/update-document-template';
import { buildDocumentTemplateDependencies } from '@/server/use-cases/records/documents/document-template-dependencies';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES } from '@/server/repositories/cache-scopes';

const documentTemplateSchema = z.object({
    templateId: z.uuid(),
    name: z.string().trim().min(1).max(120),
    type: z.enum(['ONBOARDING', 'POLICY', 'CONTRACT', 'EVIDENCE', 'TRAINING', 'PERFORMANCE', 'COMPLIANCE', 'MEDICAL', 'FINANCIAL', 'SECURITY', 'OTHER']),
    templateBody: z.string().trim().min(2),
    isActive: z.string().optional(),
});

interface ActionResponse {
    status: 'success' | 'error';
    message: string;
}

export async function updateDocumentTemplateAction(formData: FormData): Promise<ActionResponse> {
    const parsed = documentTemplateSchema.safeParse({
        templateId: formData.get('templateId'),
        name: formData.get('name'),
        type: formData.get('type'),
        templateBody: formData.get('templateBody'),
        isActive: formData.get('isActive') ?? undefined,
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid document template input.' };
    }

    const headerStore = await headers();
    const session = await getSessionContext({}, {
        headers: headerStore,
        requiredPermissions: { organization: ['update'] },
        auditSource: 'ui:hr:onboarding:document-template:update',
    });

    await updateDocumentTemplate(
        { documentTemplateRepository: buildDocumentTemplateDependencies().documentTemplateRepository },
        {
            authorization: session.authorization,
            templateId: parsed.data.templateId,
            updates: {
                name: parsed.data.name,
                type: parsed.data.type,
                templateBody: parsed.data.templateBody,
                isActive: parseBoolean(parsed.data.isActive) ?? true,
            },
        },
    );

    await invalidateOrgCache(
        session.authorization.orgId,
        CACHE_SCOPE_ONBOARDING_DOCUMENT_TEMPLATES,
        session.authorization.dataClassification,
        session.authorization.dataResidency,
    );

    return { status: 'success', message: 'Document template updated.' };
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
