import type { WorkerOptions } from 'bullmq';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import {
    leaveAccrualEnvelopeSchema,
    type LeaveAccrualPayload,
    LEAVE_ACCRUAL_JOB_NAME,
} from './accrual.types';
import { LeaveAccrualProcessor } from './accrual.processor';

export interface LeaveAccrualWorkerOptions {
    worker?: WorkerOptions;
    processor?: LeaveAccrualProcessor;
}

export class LeaveAccrualWorker extends AbstractOrgWorker<LeaveAccrualPayload> {
    private readonly processor: LeaveAccrualProcessor;

    constructor(options?: LeaveAccrualWorkerOptions) {
        super({
            queueName: WORKER_QUEUE_NAMES.HR_LEAVE_ACCRUAL,
            workerName: LEAVE_ACCRUAL_JOB_NAME,
            schema: leaveAccrualEnvelopeSchema,
        });
        this.processor = options?.processor ?? new LeaveAccrualProcessor();
    }

    protected async process(payload: LeaveAccrualPayload, context: RepositoryAuthorizationContext) {
        const result = await this.processor.process(payload, context);
        this.logger.info('hr.leave.accrual.completed', {
            orgId: context.orgId,
            balancesCreated: result.balancesCreated,
            processedEmployees: result.processedEmployees,
            skippedEmployees: result.skippedEmployees,
            dryRun: result.dryRun,
        });
        return result;
    }
}

export function registerLeaveAccrualWorker(options?: LeaveAccrualWorkerOptions) {
    const worker = new LeaveAccrualWorker(options);
    return worker.registerWorker(options?.worker);
}
