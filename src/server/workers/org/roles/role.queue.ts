import type { JobsOptions } from '@/server/lib/queueing/in-memory-queue';
import { getSharedQueue } from '@/server/lib/queue';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import type { RoleUpdateEnvelope } from './role-worker.types';
import type { RoleQueueContract, RoleQueueInput } from '@/server/repositories/contracts/org/roles/role-queue-contract';

export type RoleQueueClient = RoleQueueContract;

const DEFAULT_JOB_OPTIONS: JobsOptions = {
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
};

export function getRoleQueueClient(): RoleQueueContract {
    const queue = getSharedQueue(WORKER_QUEUE_NAMES.ORG_ROLE_UPDATES, {
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });

    return {
        async enqueueRoleUpdate(input: RoleQueueInput, jobOptions?: JobsOptions) {
            const envelope: RoleUpdateEnvelope = {
                orgId: input.orgId,
                authorization: input.authorization,
                payload: input.payload,
            };
            await queue.add('role-update', envelope, jobOptions);
        },
    };
}

