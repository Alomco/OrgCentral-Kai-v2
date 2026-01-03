"use server";

import { headers } from 'next/headers';
import { z } from 'zod';
import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import type { InvitePolicyState } from './_components/invite-policy-form';
import type { SecuritySettingsState } from './_components/security-settings-form';
import type { NotificationSettingsState } from './_components/notification-settings-form';
import { updateOrgSettings } from './settings-store';

const invitePolicyFormSchema = z
    .object({
    open: z.boolean(),
})
    .strict();

const securitySettingsFormSchema = z
    .object({
        mfaRequired: z.boolean(),
        sessionTimeoutMinutes: z.coerce.number().int().min(30).max(1440),
        ipAllowlistEnabled: z.boolean(),
        ipAllowlist: z.array(z.string().trim().min(1)),
    })
    .strict();

const notificationSettingsFormSchema = z
    .object({
        adminDigest: z.enum(['off', 'daily', 'weekly']),
        securityAlerts: z.boolean(),
        productUpdates: z.boolean(),
    })
    .strict();


export async function updateInvitePolicy(
    previous: InvitePolicyState,
    formData: FormData,
): Promise<InvitePolicyState> {
    const headerStore = await headers();

    const parsed = invitePolicyFormSchema.safeParse({
        open: formData.get('invite-open') === 'on',
    });

    if (!parsed.success) {
        return { status: 'error', message: 'Invalid form data', open: previous.open };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['manage'] },
            auditSource: 'ui:org-settings:invite-policy',
        },
    );

    await updateOrgSettings(authorization, {
        invites: { open: parsed.data.open },
    });

    return {
        status: 'success',
        message: parsed.data.open ? 'Invites are now open' : 'Invites are restricted',
        open: parsed.data.open,
    };
}

export async function updateSecuritySettings(
    previous: SecuritySettingsState,
    formData: FormData,
): Promise<SecuritySettingsState> {
    const headerStore = await headers();
    const sessionTimeoutValue = formData.get('security-session-timeout');
    const allowlistEntries = parseAllowlistEntries(formData.get('security-ip-allowlist-entries'));

    const parsed = securitySettingsFormSchema.safeParse({
        mfaRequired: formData.get('security-mfa-required') === 'on',
        sessionTimeoutMinutes: typeof sessionTimeoutValue === 'string' ? sessionTimeoutValue : '',
        ipAllowlistEnabled: formData.get('security-ip-allowlist') === 'on',
        ipAllowlist: allowlistEntries,
    });

    if (!parsed.success) {
        return { ...previous, status: 'error', message: 'Invalid security settings.' };
    }

    if (parsed.data.ipAllowlistEnabled && parsed.data.ipAllowlist.length === 0) {
        return {
            ...previous,
            status: 'error',
            message: 'Add at least one IP address before enabling the allowlist.',
        };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['manage'] },
            auditSource: 'ui:org-settings:security',
        },
    );

    await updateOrgSettings(authorization, {
        security: {
            mfaRequired: parsed.data.mfaRequired,
            sessionTimeoutMinutes: parsed.data.sessionTimeoutMinutes,
            ipAllowlistEnabled: parsed.data.ipAllowlistEnabled,
            ipAllowlist: parsed.data.ipAllowlist,
        },
    });

    return {
        status: 'success',
        message: 'Security settings updated.',
        mfaRequired: parsed.data.mfaRequired,
        sessionTimeoutMinutes: parsed.data.sessionTimeoutMinutes,
        ipAllowlistEnabled: parsed.data.ipAllowlistEnabled,
        ipAllowlist: parsed.data.ipAllowlist,
    };
}

export async function updateNotificationSettings(
    previous: NotificationSettingsState,
    formData: FormData,
): Promise<NotificationSettingsState> {
    const headerStore = await headers();
    const adminDigestValue = formData.get('notifications-admin-digest');

    const parsed = notificationSettingsFormSchema.safeParse({
        adminDigest: typeof adminDigestValue === 'string' ? adminDigestValue : 'weekly',
        securityAlerts: formData.get('notifications-security-alerts') === 'on',
        productUpdates: formData.get('notifications-product-updates') === 'on',
    });

    if (!parsed.success) {
        return { ...previous, status: 'error', message: 'Invalid notification settings.' };
    }

    const { authorization } = await getSessionContext(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['manage'] },
            auditSource: 'ui:org-settings:notifications',
        },
    );

    await updateOrgSettings(authorization, {
        notifications: {
            adminDigest: parsed.data.adminDigest,
            securityAlerts: parsed.data.securityAlerts,
            productUpdates: parsed.data.productUpdates,
        },
    });

    return {
        status: 'success',
        message: 'Notification settings updated.',
        adminDigest: parsed.data.adminDigest,
        securityAlerts: parsed.data.securityAlerts,
        productUpdates: parsed.data.productUpdates,
    };
}

function parseAllowlistEntries(value: FormDataEntryValue | null): string[] {
    if (typeof value !== 'string') {
        return [];
    }

    return value
        .split(/[\r\n,]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}
