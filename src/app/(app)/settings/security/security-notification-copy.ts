import type { SecurityNotificationType } from './security-notification-types';

export const IMMEDIATE_SECURITY_NOTIFICATIONS: SecurityNotificationType[] = [
    'security-alert',
    'new-device',
    'mfa-change',
    'password-change',
];

export const SUMMARY_SECURITY_NOTIFICATIONS: SecurityNotificationType[] = ['weekly-summary'];

export const SECURITY_NOTIFICATION_LABELS: Record<SecurityNotificationType, { label: string; description: string }> = {
    'security-alert': {
        label: 'Security alerts',
        description: 'Critical changes and suspicious activity.',
    },
    'new-device': {
        label: 'New device sign-in',
        description: 'Alerts when a new device signs in.',
    },
    'mfa-change': {
        label: 'MFA changes',
        description: 'Updates to multi-factor authentication.',
    },
    'password-change': {
        label: 'Password changes',
        description: 'Password updates and resets.',
    },
    'weekly-summary': {
        label: 'Weekly summary',
        description: 'A digest of security activity and reminders.',
    },
};
