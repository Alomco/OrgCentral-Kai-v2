import { afterEach, describe, expect, it, vi } from 'vitest';
import { WORKER_CACHE_SCOPES } from '@/server/lib/worker-constants';
import type { OrgActorResolution } from '@/server/api-adapters/cron/cron-shared';
import { triggerOnboardingReminderCron } from '../onboarding-reminders';
import { getOnboardingReminderQueueClient } from '@/server/lib/queues/hr/onboarding-reminder-queue';
import type { OnboardingReminderQueueClient } from '@/server/lib/queues/hr/onboarding-reminder-queue';
import { resolveOrgActors } from '@/server/api-adapters/cron/cron-shared';

vi.mock('@/server/lib/queues/hr/onboarding-reminder-queue', () => ({
    getOnboardingReminderQueueClient: vi.fn(),
}));

vi.mock('@/server/api-adapters/cron/cron-shared', async () => {
    const actual = await vi.importActual<typeof import('@/server/api-adapters/cron/cron-shared')>(
        '@/server/api-adapters/cron/cron-shared',
    );
    return {
        ...actual,
        resolveOrgActors: vi.fn(),
    };
});

describe('triggerOnboardingReminderCron', () => {
    afterEach(() => {
        vi.clearAllMocks();
        delete process.env.CRON_SECRET;
    });

    it('enqueues onboarding reminder jobs with cache scopes', async () => {
        process.env.CRON_SECRET = 'cron-secret';

        const enqueueReminderJob = vi.fn<OnboardingReminderQueueClient['enqueueReminderJob']>(async () => undefined);
        vi.mocked(getOnboardingReminderQueueClient).mockReturnValue({
            enqueueReminderJob,
        });

        const actors: OrgActorResolution = {
            actors: [
                {
                    orgId: 'org-1',
                    userId: 'user-1',
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
