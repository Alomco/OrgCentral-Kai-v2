'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';

import { toFieldErrors } from '../../_components/form-errors';
import {
    getComplianceTemplateSession,
} from './compliance-template-action-helpers';
import {
    complianceTemplateCreateSchema,
    complianceTemplateUpdateSchema,
    defaultCreateValues,
    parseTemplateItemsJson,
    readFormString,
    readOptionalValue,
    type ComplianceTemplateCreateState,
    type ComplianceTemplateInlineState,
} from '../compliance-template-form-utils';

const COMPLIANCE_TEMPLATES_NOT_AUTHORIZED_MESSAGE = 'Not authorized to manage compliance templates.';
const COMPLIANCE_TEMPLATES_PATH = '/hr/compliance';
const FIELD_ERROR_MESSAGE = 'Check the highlighted fields and try again.';

const complianceTemplateRepository = new PrismaComplianceTemplateRepository();

export async function createComplianceTemplateAction(
    previous: ComplianceTemplateCreateState,
    formData: FormData,
): Promise<ComplianceTemplateCreateState> {
    const session = await getComplianceTemplateSession('create');
    if (!session) {
        return {
            status: 'error',
            message: COMPLIANCE_TEMPLATES_NOT_AUTHORIZED_MESSAGE,
            values: previous.values,
        };
    }

    const categoryKeyRaw = readFormString(formData, 'categoryKey');
    const versionRaw = readFormString(formData, 'version');
    const itemsJson = readFormString(formData, 'itemsJson');

    const candidate = {
        name: readFormString(formData, 'name'),
        categoryKey: readOptionalValue(categoryKeyRaw),
        version: readOptionalValue(versionRaw),
        itemsJson,
    };

    const parsed = complianceTemplateCreateSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_ERROR_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: {
                name: candidate.name,
                categoryKey: categoryKeyRaw,
                version: versionRaw,
                itemsJson,
            },
        };
    }

    let items;
    try {
        items = parseTemplateItemsJson(parsed.data.itemsJson);
    } catch (error) {
        return {
            status: 'error',
            message: FIELD_ERROR_MESSAGE,
            fieldErrors: {
                itemsJson: error instanceof Error ? error.message : 'Items JSON is invalid.',
            },
            values: {
                name: candidate.name,
                categoryKey: categoryKeyRaw,
                version: versionRaw,
                itemsJson,
            },
        };
    }

    try {
        await complianceTemplateRepository.createTemplate({
            orgId: session.authorization.orgId,
            name: parsed.data.name,
            categoryKey: parsed.data.categoryKey,
            version: parsed.data.version,
            items,
        });

        revalidatePath(COMPLIANCE_TEMPLATES_PATH);

        return {
            status: 'success',
            message: 'Compliance template created.',
            values: defaultCreateValues,
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to create compliance template.',
            values: {
                name: candidate.name,
                categoryKey: categoryKeyRaw,
                version: versionRaw,
                itemsJson,
            },
        };
    }
}

export async function updateComplianceTemplateAction(
    _previous: ComplianceTemplateInlineState,
    formData: FormData,
): Promise<ComplianceTemplateInlineState> {
    const session = await getComplianceTemplateSession('update');
    if (!session) {
        return {
            status: 'error',
            message: COMPLIANCE_TEMPLATES_NOT_AUTHORIZED_MESSAGE,
        };
    }

    const categoryKeyRaw = readFormString(formData, 'categoryKey');
    const versionRaw = readFormString(formData, 'version');

    const candidate = {
        templateId: readFormString(formData, 'templateId'),
        name: readFormString(formData, 'name'),
        categoryKey: readOptionalValue(categoryKeyRaw),
        version: readOptionalValue(versionRaw),
        itemsJson: readFormString(formData, 'itemsJson'),
    };

    const parsed = complianceTemplateUpdateSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_ERROR_MESSAGE,
        };
    }

    let items;
    try {
        items = parseTemplateItemsJson(parsed.data.itemsJson);
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Items JSON is invalid.',
        };
    }

    try {
        await complianceTemplateRepository.updateTemplate(
            session.authorization.orgId,
            parsed.data.templateId,
            {
                name: parsed.data.name,
                categoryKey: parsed.data.categoryKey,
                version: parsed.data.version,
                items,
            },
        );

        revalidatePath(COMPLIANCE_TEMPLATES_PATH);

        return {
            status: 'success',
            message: 'Compliance template updated.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update compliance template.',
        };
    }
}

export async function deleteComplianceTemplateAction(
    _previous: ComplianceTemplateInlineState,
    formData: FormData,
): Promise<ComplianceTemplateInlineState> {
    const session = await getComplianceTemplateSession('delete');
    if (!session) {
        return {
            status: 'error',
            message: COMPLIANCE_TEMPLATES_NOT_AUTHORIZED_MESSAGE,
        };
    }

    const templateId = readFormString(formData, 'templateId');
    const parsedId = z.uuid().safeParse(templateId);
    if (!parsedId.success) {
        return {
            status: 'error',
            message: 'Invalid template id.',
        };
    }

    try {
        await complianceTemplateRepository.deleteTemplate(
            session.authorization.orgId,
            parsedId.data,
        );

        revalidatePath(COMPLIANCE_TEMPLATES_PATH);

        return {
            status: 'success',
            message: 'Compliance template deleted.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to delete compliance template.',
        };
    }
}
