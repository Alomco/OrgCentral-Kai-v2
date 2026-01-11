import type { JobsOptions, Queue } from 'bullmq';
import { getSharedQueue } from '@/server/lib/queue';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import type { RoleUpdateEnvelope } from './role-worker.types';

export interface RoleQueueClient {
    queue: Queue;
    enqueueRoleUpdate(envelope: RoleUpdateEnvelope, options?: JobsOptions): Promise<void>;
}

const DEFAULT_JOB_OPTIONS: JobsOptions = {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
};

export function getRoleQueueClient(): RoleQueueClient {
    const queue = getSharedQueue(WORKER_QUEUE_NAMES.ORG_ROLE_UPDATES, {
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });

    return {
        queue,
        async enqueueRoleUpdate(envelope, jobOptions) {
            await queue.add('role-update', envelope, jobOptions);
        },
    };
}
