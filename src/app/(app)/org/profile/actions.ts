"use server";

import { headers } from 'next/headers';
import { z } from 'zod';

import { invalidateOrgCache } from '@/server/lib/cache-tags';
import { resolveOrgContext } from '@/server/org/org-context';
import { PrismaOrganizationRepository } from '@/server/repositories/prisma/org/organization/prisma-organization-repository';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { updateOrganizationProfile } from '@/server/use-cases/org/organization/update-profile';
import {
    organizationProfileUpdateSchema,
} from '@/server/validators/org/organization-profile';

export interface OrgProfileActionState {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: Record<string, string[]>;
}

export const initialOrgProfileActionState: OrgProfileActionState = { status: 'idle' };

const ORG_PROFILE_CACHE_SCOPE = 'org:profile';

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

export async function updateOrgProfileAction(
    _previous: OrgProfileActionState,
    formData: FormData,
): Promise<OrgProfileActionState> {
    void _previous;

    const orgContext = await resolveOrgContext();
    const headerStore = await headers();

    const fieldErrors: Record<string, string[]> = {};

    const primaryContactValues = {
        name: normalizeOptionalText(formData.get('primaryContactName')),
        email: normalizeOptionalText(formData.get('primaryContactEmail')),
        phone: normalizeOptionalText(formData.get('primaryContactPhone')),
    };
    const financeContactValues = {
        name: normalizeOptionalText(formData.get('financeContactName')),
        email: normalizeOptionalText(formData.get('financeContactEmail')),
        phone: normalizeOptionalText(formData.get('financeContactPhone')),
    };

    const primaryContactParsed = contactGroupSchema.safeParse(primaryContactValues);
    if (!primaryContactParsed.success) {
        const contactErrors = collectFieldErrors(primaryContactParsed.error);
        if (contactErrors.name?.length) {
            fieldErrors.primaryContactName = contactErrors.name;
        }
        if (contactErrors.email?.length) {
            fieldErrors.primaryContactEmail = contactErrors.email;
        }
        if (contactErrors.phone?.length) {
            fieldErrors.primaryContactPhone = contactErrors.phone;
        }
    }

    const financeContactParsed = contactGroupSchema.safeParse(financeContactValues);
    if (!financeContactParsed.success) {
        const contactErrors = collectFieldErrors(financeContactParsed.error);
        if (contactErrors.name?.length) {
            fieldErrors.financeContactName = contactErrors.name;
        }
        if (contactErrors.email?.length) {
            fieldErrors.financeContactEmail = contactErrors.email;
        }
        if (contactErrors.phone?.length) {
            fieldErrors.financeContactPhone = contactErrors.phone;
        }
    }

    const hasAnyContactInput =
        Boolean(primaryContactValues.name ?? primaryContactValues.email ?? primaryContactValues.phone) ||
        Boolean(financeContactValues.name ?? financeContactValues.email ?? financeContactValues.phone);

    const contactDetails = hasAnyContactInput
        ? {
            primaryBusinessContact: primaryContactParsed.success ? primaryContactParsed.data : undefined,
            accountsFinanceContact: financeContactParsed.success ? financeContactParsed.data : undefined,
        }
        : null;

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
            if (errors.length > 0) {
                fieldErrors[key] = errors;
            }
        }
        return {
            status: 'error',
            message: 'Please correct the highlighted fields.',
            fieldErrors,
        };
    }

    if (Object.keys(fieldErrors).length > 0) {
        return {
            status: 'error',
            message: 'Please correct the highlighted fields.',
            fieldErrors,
        };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            orgId: orgContext.orgId,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-profile:update',
            action: 'org.organization.update',
            resourceType: 'org.organization',
            resourceAttributes: { orgId: orgContext.orgId },
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

    await invalidateOrgCache(
        authorization.orgId,
        ORG_PROFILE_CACHE_SCOPE,
        authorization.dataClassification,
        authorization.dataResidency,
    );

    return { status: 'success', message: 'Profile updated.' };
}

function normalizeRequiredText(value: FormDataEntryValue | null): string {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim();
}

function normalizeNullableText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeOptionalText(value: FormDataEntryValue | null): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
}
