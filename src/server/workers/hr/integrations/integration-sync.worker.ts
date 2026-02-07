import type { WorkerOptions } from '@/server/lib/queueing/in-memory-queue';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';

import {
    HR_INTEGRATION_SYNC_JOB_NAME,
    integrationSyncEnvelopeSchema,
    type IntegrationSyncPayload,
} from './integration-sync.types';

export interface IntegrationSyncWorkerOptions {
    worker?: WorkerOptions;
}

export class IntegrationSyncWorker extends AbstractOrgWorker<IntegrationSyncPayload> {
    constructor() {
        super({
            queueName: WORKER_QUEUE_NAMES.HR_INTEGRATIONS_SYNC,
            workerName: HR_INTEGRATION_SYNC_JOB_NAME,
            schema: integrationSyncEnvelopeSchema,
        });
    }

    protected process(payload: IntegrationSyncPayload, context: RepositoryAuthorizationContext): Promise<unknown> {
        this.logger.info('hr.integrations.sync.stub', {
            orgId: context.orgId,
            provider: payload.provider,
            trigger: payload.trigger,
            requestedByUserId: payload.requestedByUserId,
        });

        return Promise.resolve({
            status: 'stub',
            provider: payload.provider,
            processedAt: new Date().toISOString(),
        });
    }
}

export function registerIntegrationSyncWorker(options?: IntegrationSyncWorkerOptions) {
    const worker = new IntegrationSyncWorker();
    return worker.registerWorker(options?.worker);
}

