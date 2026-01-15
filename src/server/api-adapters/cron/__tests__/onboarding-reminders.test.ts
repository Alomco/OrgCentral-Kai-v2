import { afterEach, describe, expect, it, vi } from 'vitest';
import { WORKER_CACHE_SCOPES } from '@/server/lib/worker-constants';
import type { OrgActorResolution } from '@/server/api-adapters/cron/cron-shared';
import { triggerOnboardingReminderCron } from '../onboarding-reminders';
import { getOnboardingReminderQueueClient } from '@/server/lib/queues/hr/onboarding-reminder-queue';
import type { OnboardingReminderQueueClient } from '@/server/lib/queues/hr/onboarding-reminder-queue';
import {
    assertCronSecret,
    parseCronRequestOptions,
    resolveOrgActors,
} from '@/server/api-adapters/cron/cron-shared';

vi.mock('@/server/lib/queues/hr/onboarding-reminder-queue', () => ({
    getOnboardingReminderQueueClient: vi.fn(),
}));

vi.mock('@/server/api-adapters/cron/cron-shared', () => ({
    assertCronSecret: vi.fn(),
    parseCronRequestOptions: vi.fn(() => ({ orgIds: undefined, dryRun: false })),
    resolveOrgActors: vi.fn(),
}));

describe('triggerOnboardingReminderCron', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('enqueues onboarding reminder jobs with cache scopes', async () => {
        vi.mocked(assertCronSecret).mockImplementation(() => undefined);
        vi.mocked(parseCronRequestOptions).mockReturnValue({ orgIds: undefined, dryRun: false });

        const enqueueReminderJob = vi.fn<OnboardingReminderQueueClient['enqueueReminderJob']>(async () => undefined);
        vi.mocked(getOnboardingReminderQueueClient).mockReturnValue({
            enqueueReminderJob,
        });

        const actors: OrgActorResolution = {
            actors: [
                {
                    orgId: '11111111-1111-4111-8111-111111111111',
                    userId: '22222222-2222-4222-8222-222222222222',
                    role: 'owner',
                    dataResidency: 'UK_ONLY',
                    dataClassification: 'OFFICIAL',
                },
            ],
            skipped: [],
        };

        vi.mocked(resolveOrgActors).mockResolvedValue(actors);

        const request = new Request('http://localhost/api/cron/onboarding-reminders', {
            headers: { 'x-cron-secret': 'cron-secret' },
        });

        const result = await triggerOnboardingReminderCron(request);

        expect(result.jobsEnqueued).toBe(1);
        const envelope = enqueueReminderJob.mock.calls[0]?.[0];
        if (!envelope) {
            throw new Error('Expected enqueueReminderJob to be called');
        }
        expect(envelope.authorization.auditSource).toBe('cron:hr:onboarding:reminder');
        expect(envelope.metadata?.cacheScopes).toContain(WORKER_CACHE_SCOPES.HR_ONBOARDING);
    });
});
