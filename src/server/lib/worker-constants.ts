import type { CacheScope } from '@/server/lib/cache-tags';

export const WORKER_QUEUE_NAMES = {
    AUTH_SYNC: 'auth-sync',
    HR_ABSENCE_AI_VALIDATION: 'hr-absences-ai-validation',
    HR_LEAVE_ACCRUAL: 'hr-leave-accrual',
    HR_COMPLIANCE_REMINDER: 'hr-compliance-reminder',
    HR_TRAINING_REMINDER: 'hr-training-reminder',
    HR_ONBOARDING_REMINDER: 'hr-onboarding-reminder',
    HR_PEOPLE_RETENTION: 'hr-people-retention',
    HR_INTEGRATIONS_SYNC: 'hr-integrations-sync',
    NOTIFICATIONS_DISPATCH: 'notifications-dispatcher',
    ORG_ROLE_UPDATES: 'org-role-updates',
} as const;

export type WorkerQueueName = (typeof WORKER_QUEUE_NAMES)[keyof typeof WORKER_QUEUE_NAMES];

export const WORKER_CACHE_SCOPES = {
    HR_ABSENCES: 'hr:absences',
    HR_LEAVE: 'hr:leave',
    HR_COMPLIANCE: 'hr:compliance',
    HR_TRAINING: 'hr:training',
    HR_ONBOARDING: 'hr:onboarding',
    NOTIFICATIONS: 'notifications',
    PEOPLE_RETENTION: 'hr:people:retention',
    HR_INTEGRATIONS: 'hr:integrations',
} as const satisfies Record<string, CacheScope>;

export type WorkerCacheScope = (typeof WORKER_CACHE_SCOPES)[keyof typeof WORKER_CACHE_SCOPES];

export const DEFAULT_WORKER_TIMEZONE = 'Europe/London';
