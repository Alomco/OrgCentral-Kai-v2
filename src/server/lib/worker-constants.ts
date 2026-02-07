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

export const WORKER_QUEUE_MAX_PENDING_JOBS = {
    [WORKER_QUEUE_NAMES.AUTH_SYNC]: 5_000,
    [WORKER_QUEUE_NAMES.HR_ABSENCE_AI_VALIDATION]: 2_000,
    [WORKER_QUEUE_NAMES.HR_LEAVE_ACCRUAL]: 1_000,
    [WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER]: 1_000,
    [WORKER_QUEUE_NAMES.HR_TRAINING_REMINDER]: 1_000,
    [WORKER_QUEUE_NAMES.HR_ONBOARDING_REMINDER]: 1_000,
    [WORKER_QUEUE_NAMES.HR_PEOPLE_RETENTION]: 500,
    [WORKER_QUEUE_NAMES.HR_INTEGRATIONS_SYNC]: 1_500,
    [WORKER_QUEUE_NAMES.NOTIFICATIONS_DISPATCH]: 10_000,
    [WORKER_QUEUE_NAMES.ORG_ROLE_UPDATES]: 2_000,
} as const satisfies Record<WorkerQueueName, number>;

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

const WORKER_QUEUE_NAME_SET = new Set<string>(Object.values(WORKER_QUEUE_NAMES));

export function isWorkerQueueName(name: string): name is WorkerQueueName {
    return WORKER_QUEUE_NAME_SET.has(name);
}

export function getWorkerQueueMaxPendingJobs(name: WorkerQueueName): number {
    return WORKER_QUEUE_MAX_PENDING_JOBS[name];
}
