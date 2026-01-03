'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getHrPolicyService } from '@/server/services/hr/policies/hr-policy-service.provider';
import { POLICY_CATEGORY_VALUES } from '@/server/services/hr/policies/hr-policy-schemas';

import { toFieldErrors } from '../_components/form-errors';
import {
    buildDefaultPolicyAdminValues,
    parseCommaList,
    policyAdminCreateSchema,
    policyAdminUpdateSchema,
    readFormBoolean,
    readFormString,
    readOptionalNullableValue,
    type PolicyAdminCreateState,
    type PolicyAdminInlineState,
} from './policy-admin-form-utils';

export type {
    PolicyAdminCreateState,
    PolicyAdminInlineState,
    PolicyAdminCreateValues,
} from './policy-admin-form-utils';

const policyService = getHrPolicyService();
const POLICIES_PATH = '/hr/policies';
const FIELD_ERROR_MESSAGE = 'Check the highlighted fields and try again.';

export async function createPolicyAdminAction(
    previous: PolicyAdminCreateState,
    formData: FormData,
): Promise<PolicyAdminCreateState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:policies:create',
                action: 'create',
                resourceType: 'hr.policy',
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to manage policies.',
            values: previous.values,
        };
    }

    const expiryRaw = readFormString(formData, 'expiryDate');
    const rolesRaw = readFormString(formData, 'applicableRoles');
    const departmentsRaw = readFormString(formData, 'applicableDepartments');

    const candidate = {
        title: readFormString(formData, 'title'),
        content: readFormString(formData, 'content'),
        category: readFormString(formData, 'category'),
        version: readFormString(formData, 'version'),
        effectiveDate: readFormString(formData, 'effectiveDate'),
        expiryDate: readOptionalNullableValue(expiryRaw),
        status: readFormString(formData, 'status'),
        requiresAcknowledgment: readFormBoolean(formData, 'requiresAcknowledgment', true),
        applicableRoles: rolesRaw,
        applicableDepartments: departmentsRaw,
    };

    const parsed = policyAdminCreateSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_ERROR_MESSAGE,
            fieldErrors: toFieldErrors(parsed.error),
            values: {
                title: candidate.title,
                content: candidate.content,
                category: candidate.category as PolicyAdminCreateState['values']['category'],
                version: candidate.version,
                effectiveDate: candidate.effectiveDate,
                expiryDate: expiryRaw,
                status: candidate.status as PolicyAdminCreateState['values']['status'],
                requiresAcknowledgment: candidate.requiresAcknowledgment,
                applicableRoles: rolesRaw,
                applicableDepartments: departmentsRaw,
            },
        };
    }

    const applicableRoles = parseCommaList(parsed.data.applicableRoles ?? '');
    const applicableDepartments = parseCommaList(parsed.data.applicableDepartments ?? '');

    try {
        await policyService.createPolicy({
            authorization: session.authorization,
            policy: {
                title: parsed.data.title,
                content: parsed.data.content,
                category: parsed.data.category,
                version: parsed.data.version,
                effectiveDate: parsed.data.effectiveDate,
                expiryDate: parsed.data.expiryDate ?? null,
                applicableRoles,
                applicableDepartments,
                requiresAcknowledgment: parsed.data.requiresAcknowledgment,
                status: parsed.data.status,
                dataClassification: session.authorization.dataClassification,
                residencyTag: session.authorization.dataResidency,
            },
        });

        revalidatePath(POLICIES_PATH);

        return {
            status: 'success',
            message: 'Policy created.',
            values: buildDefaultPolicyAdminValues([...POLICY_CATEGORY_VALUES]),
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to create policy.',
            values: {
                title: candidate.title,
                content: candidate.content,
                category: candidate.category as PolicyAdminCreateState['values']['category'],
                version: candidate.version,
                effectiveDate: candidate.effectiveDate,
                expiryDate: expiryRaw,
                status: candidate.status as PolicyAdminCreateState['values']['status'],
                requiresAcknowledgment: candidate.requiresAcknowledgment,
                applicableRoles: rolesRaw,
                applicableDepartments: departmentsRaw,
            },
        };
    }
}

export async function updatePolicyAdminAction(
    _previous: PolicyAdminInlineState,
    formData: FormData,
): Promise<PolicyAdminInlineState> {
    let session: Awaited<ReturnType<typeof getSessionContext>>;
    try {
        const headerStore = await headers();
        session = await getSessionContext(
            {},
            {
                headers: headerStore,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'ui:hr:policies:update',
                action: 'update',
                resourceType: 'hr.policy',
            },
        );
    } catch {
        return {
            status: 'error',
            message: 'Not authorized to manage policies.',
        };
    }

    const expiryRaw = readFormString(formData, 'expiryDate');

    const candidate = {
        policyId: readFormString(formData, 'policyId'),
        title: readFormString(formData, 'title'),
        content: readFormString(formData, 'content'),
        category: readFormString(formData, 'category'),
        version: readFormString(formData, 'version'),
        effectiveDate: readFormString(formData, 'effectiveDate'),
        expiryDate: readOptionalNullableValue(expiryRaw),
        status: readFormString(formData, 'status'),
        requiresAcknowledgment: readFormBoolean(formData, 'requiresAcknowledgment', true),
        applicableRoles: readFormString(formData, 'applicableRoles'),
        applicableDepartments: readFormString(formData, 'applicableDepartments'),
    };

    const parsed = policyAdminUpdateSchema.safeParse(candidate);
    if (!parsed.success) {
        return {
            status: 'error',
            message: FIELD_ERROR_MESSAGE,
        };
    }

    const applicableRoles = parseCommaList(parsed.data.applicableRoles ?? '');
    const applicableDepartments = parseCommaList(parsed.data.applicableDepartments ?? '');

    try {
        await policyService.updatePolicy({
            authorization: session.authorization,
            policyId: parsed.data.policyId,
            updates: {
                title: parsed.data.title,
                content: parsed.data.content,
                category: parsed.data.category,
                version: parsed.data.version,
                effectiveDate: parsed.data.effectiveDate,
                expiryDate: parsed.data.expiryDate ?? null,
                applicableRoles,
                applicableDepartments,
                requiresAcknowledgment: parsed.data.requiresAcknowledgment,
                status: parsed.data.status,
            },
        });

        revalidatePath(POLICIES_PATH);
        revalidatePath(`/hr/policies/${parsed.data.policyId}`);

        return {
            status: 'success',
            message: 'Policy updated.',
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to update policy.',
        };
    }
}
