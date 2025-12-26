'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_TEMPLATES } from '@/server/repositories/cache-scopes';
import { PrismaChecklistTemplateRepository } from '@/server/repositories/prisma/hr/onboarding';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateChecklistTemplate } from '@/server/use-cases/hr/onboarding/templates/update-checklist-template';
import {
    parseChecklistTemplateIdentifier,
    parseChecklistTemplateUpdatePayload,
} from '@/server/validators/hr/onboarding/checklist-template-validators';

import {
    buildInitialChecklistTemplateUpdateFormState,
    type ChecklistTemplateUpdateFormState,
} from '../checklist-templates.form-state';
import { checklistTemplateUpdateFormSchema } from '../checklist-templates.schema';
import { toFieldErrors } from '../../_components/form-errors';

import {
    CHECKLIST_TEMPLATES_FIELD_ERROR_MESSAGE,
    CHECKLIST_TEMPLATES_FIELD_TYPE,
    CHECKLIST_TEMPLATES_REDIRECT_PATH,
    CHECKLIST_TEMPLATES_RESOURCE_TYPE,
    parseItemsText,
    parseTemplateType,
    readFormString,
} from './checklist-templates.helpers';

const checklistTemplateRepository = new PrismaChecklistTemplateRepository();

export async function updateChecklistTemplateAction(
    previous: ChecklistTemplateUpdateFormState,
    formData: FormData,
): Promise<ChecklistTemplateUpdateFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;

    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:onboarding:templates:update',
                resourceType: CHECKLIST_TEMPLATES_RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to update templates.',
            values: previous.values,
        };
    }

    try {
        const candidate = {
            templateId: readFormString(formData, 'templateId'),
            name: readFormString(formData, 'name') || undefined,
            type: readFormString(formData, CHECKLIST_TEMPLATES_FIELD_TYPE)
                ? parseTemplateType(readFormString(formData, CHECKLIST_TEMPLATES_FIELD_TYPE))
                : undefined,
            items: readFormString(formData, 'items') || undefined,
        };

        const parsed = checklistTemplateUpdateFormSchema.safeParse(candidate);
        if (!parsed.success) {
            return {
                status: 'error',
                message: CHECKLIST_TEMPLATES_FIELD_ERROR_MESSAGE,
                fieldErrors: toFieldErrors(parsed.error),
                values: previous.values,
            };
        }

        const templateId = parseChecklistTemplateIdentifier(parsed.data.templateId);

        const updates = parseChecklistTemplateUpdatePayload({
            name: parsed.data.name,
            type: parsed.data.type,
            items: parsed.data.items ? parseItemsText(parsed.data.items) : undefined,
        });

        await updateChecklistTemplate(
            { checklistTemplateRepository },
            {
                authorization: session.authorization,
                templateId,
                updates,
            },
        );

        await invalidateOrgCache(
            session.authorization.orgId,
            CACHE_SCOPE_CHECKLIST_TEMPLATES,
            session.authorization.dataClassification,
            session.authorization.dataResidency,
        );

        redirect(CHECKLIST_TEMPLATES_REDIRECT_PATH);
    } catch {
        return {
            status: 'error',
            message: 'Unable to update template.',
            fieldErrors: undefined,
            values: buildInitialChecklistTemplateUpdateFormState(previous.values).values,
        };
    }
}
