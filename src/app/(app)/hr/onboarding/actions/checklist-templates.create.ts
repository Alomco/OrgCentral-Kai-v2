'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_CHECKLIST_TEMPLATES } from '@/server/repositories/cache-scopes';
import { PrismaChecklistTemplateRepository } from '@/server/repositories/prisma/hr/onboarding';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { createChecklistTemplate } from '@/server/use-cases/hr/onboarding/templates/create-checklist-template';

import {
    buildInitialChecklistTemplateCreateFormState,
    type ChecklistTemplateCreateFormState,
} from '../checklist-templates.form-state';
import { checklistTemplateCreateFormSchema } from '../checklist-templates.schema';
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

export async function createChecklistTemplateAction(
    previous: ChecklistTemplateCreateFormState,
    formData: FormData,
): Promise<ChecklistTemplateCreateFormState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;

    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:onboarding:templates:create',
                resourceType: CHECKLIST_TEMPLATES_RESOURCE_TYPE,
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to create templates.',
            values: previous.values,
        };
    }

    const candidate = {
        name: readFormString(formData, 'name'),
        type: parseTemplateType(readFormString(formData, CHECKLIST_TEMPLATES_FIELD_TYPE)),
        items: readFormString(formData, 'items'),
    };

    const parsed = checklistTemplateCreateFormSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: CHECKLIST_TEMPLATES_FIELD_ERROR_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: previous.values,
        };
    }

    try {
        await createChecklistTemplate(
            { checklistTemplateRepository },
            {
                authorization: session.authorization,
                template: {
                    name: parsed.data.name,
                    type: parsed.data.type,
                    items: parseItemsText(parsed.data.items),
                },
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
            message: 'Unable to create template.',
            fieldErrors: undefined,
            values: buildInitialChecklistTemplateCreateFormState(parsed.data).values,
        };
    }
}
