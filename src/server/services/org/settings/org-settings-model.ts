import type { Prisma } from '@prisma/client';
import { z } from 'zod';

export const invitePolicySchema = z.object({
    open: z.boolean(),
});

export const securitySettingsSchema = z.object({
    mfaRequired: z.boolean(),
    sessionTimeoutMinutes: z.number().int().min(30).max(1440),
    ipAllowlistEnabled: z.boolean(),
    ipAllowlist: z.array(z.string().trim().min(1)).default([]),
});

export const notificationSettingsSchema = z.object({
    adminDigest: z.enum(['off', 'daily', 'weekly']),
    securityAlerts: z.boolean(),
    productUpdates: z.boolean(),
});

export const billingSettingsSchema = z.object({
    billingEmail: z.string(),
    billingCadence: z.enum(['monthly', 'annual']),
    autoRenew: z.boolean(),
    invoicePrefix: z.string().trim().max(24).optional(),
    vatNumber: z.string().trim().max(32).optional(),
    billingAddress: z
        .object({
            line1: z.string().trim().min(1).max(120),
            line2: z.string().trim().max(120).optional(),
            city: z.string().trim().min(1).max(80),
            postcode: z.string().trim().min(1).max(20),
            country: z.string().trim().min(2).max(2).default('GB'),
        })
        .optional(),
});

export const organizationSettingsSchema = z
    .object({
        invites: invitePolicySchema.optional(),
        security: securitySettingsSchema.optional(),
        notifications: notificationSettingsSchema.optional(),
        billing: billingSettingsSchema.optional(),
    })
    .loose();

export type InvitePolicySettings = z.infer<typeof invitePolicySchema>;
export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type BillingSettings = z.infer<typeof billingSettingsSchema>;

export interface OrgSettings {
    invites: InvitePolicySettings;
    security: SecuritySettings;
    notifications: NotificationSettings;
    billing: BillingSettings;
}

export const defaultOrgSettings: OrgSettings = {
    invites: {
        open: false,
    },
    security: {
        mfaRequired: false,
        sessionTimeoutMinutes: 480,
        ipAllowlistEnabled: false,
        ipAllowlist: [],
    },
    notifications: {
        adminDigest: 'weekly',
        securityAlerts: true,
        productUpdates: true,
    },
    billing: {
        billingEmail: '',
        billingCadence: 'monthly',
        autoRenew: true,
        invoicePrefix: undefined,
        vatNumber: undefined,
        billingAddress: undefined,
    },
};

export function normalizeOrgSettings(value: Prisma.JsonValue | null | undefined): OrgSettings {
    const parsed = organizationSettingsSchema.safeParse(value ?? {});
    const data = parsed.success ? parsed.data : {};

    return {
        invites: { ...defaultOrgSettings.invites, ...(data.invites ?? {}) },
        security: { ...defaultOrgSettings.security, ...(data.security ?? {}) },
        notifications: { ...defaultOrgSettings.notifications, ...(data.notifications ?? {}) },
        billing: { ...defaultOrgSettings.billing, ...(data.billing ?? {}) },
    };
}
