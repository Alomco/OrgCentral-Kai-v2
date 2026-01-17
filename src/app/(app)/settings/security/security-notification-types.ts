export const SECURITY_NOTIFICATION_TYPE_VALUES = [
    'security-alert',
    'new-device',
    'mfa-change',
    'password-change',
    'weekly-summary',
] as const;

export type SecurityNotificationType = (typeof SECURITY_NOTIFICATION_TYPE_VALUES)[number];
