"use server";
import { headers } from 'next/headers';
import { z } from 'zod';
import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateOrganizationProfile } from '@/server/use-cases/org/organization/update-profile';
import {
    organizationProfileUpdateSchema,
    type OrganizationProfileUpdateInput,
} from '@/server/validators/org/organization-profile';
import {
    normalizeNullableText,
    normalizeOptionalText,
    normalizeRequiredText,
} from './profile-form-utils';

export interface OrgProfileActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Record<string, string[]>;
}

export const initialOrgProfileActionState: OrgProfileActionState = { status: 'idle' };

const ORG_PROFILE_CACHE_SCOPE = 'org:profile';
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

const contactGroupSchema = z
    .object({
        name: z.string().trim().min(1, 'Name is required').max(120).optional(),
        email: z.email('Enter a valid email address').max(254).optional(),
        phone: z.string().trim().min(1).max(64).optional(),
    })
    .strict()
    .superRefine((value, context) => {
        const hasAny = Boolean(value.name ?? value.email ?? value.phone);
        if (!hasAny) {
            return;
        }

        if (!value.name) {
            context.addIssue({ code: 'custom', message: 'Name is required', path: ['name'] });
        }
        if (!value.email) {
            context.addIssue({ code: 'custom', message: 'Email is required', path: ['email'] });
        }
    });

type ContactGroupInput = z.infer<typeof contactGroupSchema>;
type ContactParseResult = ReturnType<typeof contactGroupSchema.safeParse>;

function collectFieldErrors(error: z.ZodError): Partial<Record<string, string[]>> {
    const out: Partial<Record<string, string[]>> = {};
    for (const issue of error.issues) {
        const key = typeof issue.path[0] === 'string' ? issue.path[0] : undefined;
        if (!key) {
            continue;
        }
        (out[key] ??= []).push(issue.message);
    }
    return out;
}

function readContactGroup(formData: FormData, prefix: 'primary' | 'finance'): ContactGroupInput {
    const toKey = (field: 'Name' | 'Email' | 'Phone') => `${prefix}Contact${field}`;
    return {
        name: normalizeOptionalText(formData.get(toKey('Name'))),
        email: normalizeOptionalText(formData.get(toKey('Email'))),
        phone: normalizeOptionalText(formData.get(toKey('Phone'))),
    };
}

function assignContactErrors(
    fieldErrors: Record<string, string[]>,
    prefix: 'primary' | 'finance',
    parsed: ContactParseResult,
): void {
    if (parsed.success) {
        return;
    }
    const errors = collectFieldErrors(parsed.error);
    const toKey = (field: 'Name' | 'Email' | 'Phone') => `${prefix}Contact${field}`;

    if (errors.name?.length) {
        fieldErrors[toKey('Name')] = errors.name;
    }
    if (errors.email?.length) {
        fieldErrors[toKey('Email')] = errors.email;
    }
    if (errors.phone?.length) {
        fieldErrors[toKey('Phone')] = errors.phone;
    }
}

function buildContactDetails(
    primaryParsed: ContactParseResult,
    financeParsed: ContactParseResult,
    hasAnyContactInput: boolean,
): OrganizationProfileUpdateInput['contactDetails'] {
    if (!hasAnyContactInput) {
        return null;
    }
    return {
        primaryBusinessContact: toContactInfo(primaryParsed),
        accountsFinanceContact: toContactInfo(financeParsed),
    };
}

function toErrorState(fieldErrors: Record<string, string[]>): OrgProfileActionState {
    return {
        status: 'error',
        message: FIELD_ERROR_MESSAGE,
        fieldErrors,
    };
}

type ContactInfoOutput = NonNullable<OrganizationProfileUpdateInput['contactDetails']>['primaryBusinessContact'];

function toContactInfo(parsed: ContactParseResult): ContactInfoOutput | undefined {
    if (!parsed.success) {
        return undefined;
    }
    const { name, email, phone } = parsed.data;
    if (!name || !email) {
        return undefined;
    }
    return phone ? { name, email, phone } : { name, email };
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
        ORG_PROFILE_CACHE_SCOPE,
        authorization.dataClassification,
        authorization.dataResidency,
    );

    return { status: 'success', message: 'Profile updated.' };
}
