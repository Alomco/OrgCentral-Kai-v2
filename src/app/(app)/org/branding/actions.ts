'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { PrismaBrandingRepository } from '@/server/repositories/prisma/org/branding/prisma-branding-repository';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { resetOrgBranding } from '@/server/use-cases/org/branding/reset-org-branding';
import { updateOrgBranding } from '@/server/use-cases/org/branding/update-org-branding';

import { initialOrgBrandingState, type OrgBrandingState } from './actions.state';

const brandingSchema = z
    .object({
        companyName: z.string().trim().min(1).max(120).nullable(),
        logoUrl: z.string().trim().min(1).max(2048).nullable(),
        faviconUrl: z.string().trim().min(1).max(2048).nullable(),
        primaryColor: z.string().trim().min(1).max(32).nullable(),
        secondaryColor: z.string().trim().min(1).max(32).nullable(),
        accentColor: z.string().trim().min(1).max(32).nullable(),
        customCss: z.string().max(25000).nullable(),
    })
    .strict();

export async function updateOrgBrandingAction(
    _previous: OrgBrandingState = initialOrgBrandingState,
    formData: FormData,
): Promise<OrgBrandingState> {
    void _previous;

    const headerStore = await headers();

    const parsed = brandingSchema.safeParse({
        companyName: normalizeNullableText(formData.get('companyName')),
        logoUrl: normalizeNullableText(formData.get('logoUrl')),
        faviconUrl: normalizeNullableText(formData.get('faviconUrl')),
        primaryColor: normalizeNullableText(formData.get('primaryColor')),
        secondaryColor: normalizeNullableText(formData.get('secondaryColor')),
        accentColor: normalizeNullableText(formData.get('accentColor')),
        customCss: normalizeNullableMultiline(formData.get('customCss')),
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid branding data.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-branding:update',
        },
    );

    const repository = new PrismaBrandingRepository();
    await updateOrgBranding(
        { brandingRepository: repository },
        {
            authorization,
            orgId: authorization.orgId,
            updates: parsed.data,
        },
    );

    return { status: 'success', message: 'Branding updated.' };
}

export async function resetOrgBrandingAction(
    _previous: OrgBrandingState = initialOrgBrandingState,
    _formData: FormData,
): Promise<OrgBrandingState> {
    void _previous;
    void _formData;

    const headerStore = await headers();

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['update'] },
            auditSource: 'ui:org-branding:reset',
        },
    );

    const repository = new PrismaBrandingRepository();
    await resetOrgBranding(
        { brandingRepository: repository },
        {
            authorization,
            orgId: authorization.orgId,
        },
    );

    return { status: 'success', message: 'Branding reset.' };
}

function normalizeNullableText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeNullableMultiline(value: FormDataEntryValue | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    return value.length > 0 ? value : null;
}
