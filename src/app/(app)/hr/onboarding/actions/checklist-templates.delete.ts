'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_TEMPLATES } from '@/server/repositories/cache-scopes';
import { PrismaChecklistTemplateRepository } from '@/server/repositories/prisma/hr/onboarding';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { deleteChecklistTemplate } from '@/server/use-cases/hr/onboarding/templates/delete-checklist-template';
import { parseChecklistTemplateIdentifier } from '@/server/validators/hr/onboarding/checklist-template-validators';

import {
    buildInitialChecklistTemplateDeleteFormState,
    type ChecklistTemplateDeleteFormState,
} from '../checklist-templates.form-state';
import { checklistTemplateDeleteFormSchema } from '../checklist-templates.schema';
import { toFieldErrors } from '../../_components/form-errors';

import {
    CHECKLIST_TEMPLATES_FIELD_ERROR_MESSAGE,
    CHECKLIST_TEMPLATES_REDIRECT_PATH,
    CHECKLIST_TEMPLATES_RESOURCE_TYPE,
    readFormString,
} from './checklist-templates.helpers';

const checklistTemplateRepository = new PrismaChecklistTemplateRepository();

export async function deleteChecklistTemplateAction(
    previous: ChecklistTemplateDeleteFormState,
    formData: FormData,
): Promise<ChecklistTemplateDeleteFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;

    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:onboarding:templates:delete',
                resourceType: CHECKLIST_TEMPLATES_RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to delete templates.',
            values: previous.values,
        };
    }

    try {
        const candidate = { templateId: readFormString(formData, 'templateId') };

        const parsed = checklistTemplateDeleteFormSchema.safeParse(candidate);
        if (!parsed.success) {
            return {
                status: 'error',
                message: CHECKLIST_TEMPLATES_FIELD_ERROR_MESSAGE,
                fieldErrors: toFieldErrors(parsed.error),
                values: previous.values,
            };
        }

        const templateId = parseChecklistTemplateIdentifier(parsed.data.templateId);

        await deleteChecklistTemplate(
            { checklistTemplateRepository },
            {
                authorization: session.authorization,
                templateId,
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
            message: 'Unable to delete template.',
            fieldErrors: undefined,
            values: buildInitialChecklistTemplateDeleteFormState(previous.values).values,
        };
    }
}
