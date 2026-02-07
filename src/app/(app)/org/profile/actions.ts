/**
 * TODO: Refactor this file (currently > 250 LOC).
 * Action: Split into smaller modules and ensure adherence to SOLID principles, Dependency Injection, and Design Patterns.
 */
"use server";
import { headers } from 'next/headers';
import { z } from 'zod';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { CACHE_SCOPE_ORG_PROFILE } from '@/server/repositories/cache-scopes';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateOrganizationProfile } from '@/server/use-cases/org/organization/update-profile';
import {
    organizationProfileUpdateSchema,
} from '@/server/validators/org/organization-profile';
import {
    normalizeNullableText,
    normalizeRequiredText,
} from './profile-form-utils';
import {
    assignContactErrors,
    buildContactDetails,
    collectFieldErrors,
    contactGroupSchema,
    readContactGroup,
} from './contact-helpers';
import type { OrgProfileActionState } from './actions.state';

const FIELD_ERROR_MESSAGE = 'Please correct the highlighted fields.';

const orgProfileCoreFormSchema = organizationProfileUpdateSchema
    .omit({ contactDetails: true })
    .extend({
        name: z.string().trim().min(1).max(120),
        incorporationDate: z
            .string()
            .trim()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
            .nullable()
            .optional(),
    });

function toErrorState(fieldErrors: Record<string, string[]>): OrgProfileActionState {
    return {
        status: 'error',
        message: FIELD_ERROR_MESSAGE,
        fieldErrors,
    };
}

export async function updateOrgProfileAction(
    _previous: OrgProfileActionState,
    formData: FormData,
): Promise<OrgProfileActionState> {
    void _previous;

    const headerStore = await headers();

    const fieldErrors: Record<string, string[]> = {};

    const primaryContactValues = readContactGroup(formData, 'primary');
    const financeContactValues = readContactGroup(formData, 'finance');

    const primaryContactParsed = contactGroupSchema.safeParse(primaryContactValues);
    const financeContactParsed = contactGroupSchema.safeParse(financeContactValues);

    assignContactErrors(fieldErrors, 'primary', primaryContactParsed);
    assignContactErrors(fieldErrors, 'finance', financeContactParsed);

    const hasAnyContactInput =
        Boolean(primaryContactValues.name ?? primaryContactValues.email ?? primaryContactValues.phone) ||
        Boolean(financeContactValues.name ?? financeContactValues.email ?? financeContactValues.phone);

    const contactDetails = buildContactDetails(
        primaryContactParsed,
        financeContactParsed,
        hasAnyContactInput,
    );

    const payload = {
        name: normalizeRequiredText(formData.get('name')),
        address: normalizeNullableText(formData.get('address')),
        phone: normalizeNullableText(formData.get('phone')),
        website: normalizeNullableText(formData.get('website')),
        companyType: normalizeNullableText(formData.get('companyType')),
        industry: normalizeNullableText(formData.get('industry')),
        employeeCountRange: normalizeNullableText(formData.get('employeeCountRange')),
        incorporationDate: normalizeNullableText(formData.get('incorporationDate')),
        registeredOfficeAddress: normalizeNullableText(formData.get('registeredOfficeAddress')),
    };

    const parsed = orgProfileCoreFormSchema.safeParse(payload);
    if (!parsed.success) {
        const coreErrors = collectFieldErrors(parsed.error);
        for (const [key, errors] of Object.entries(coreErrors)) {
            if (errors && errors.length > 0) {
                fieldErrors[key] = errors;
            }
        }
        return toErrorState(fieldErrors);
    }

    if (Object.keys(fieldErrors).length > 0) {
        return toErrorState(fieldErrors);
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-profile:update',
            action: 'org.organization.update',
            resourceType: 'org.organization',
        },
    );

    const repository = new PrismaOrganizationRepository();
    await updateOrganizationProfile(
        { organizationRepository: repository },
        {
            authorization,
            orgId: authorization.orgId,
            updates: {
                ...parsed.data,
                contactDetails,
            },
        },
    );

    await recordAuditEvent({
        orgId: authorization.orgId,
        userId: authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'org.profile.update',
        resource: 'org.organization',
        resourceId: authorization.orgId,
        payload: {
            updatedFields: Object.keys(parsed.data),
            contactDetails: contactDetails === null ? 'cleared' : 'updated',
        },
        correlationId: authorization.correlationId,
        residencyZone: authorization.dataResidency,
        classification: authorization.dataClassification,
        auditSource: authorization.auditSource,
        auditBatchId: authorization.auditBatchId,
    });

    await invalidateOrgCache(
        authorization.orgId,
        CACHE_SCOPE_ORG_PROFILE,
        authorization.dataClassification,
        authorization.dataResidency,
    );

    return { status: 'success', message: 'Profile updated.' };
}
