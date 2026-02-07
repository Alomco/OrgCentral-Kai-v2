import type { WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/workers/constants';
import { documentExpiryEnvelopeSchema, type DocumentExpiryPayload } from './document-expiry.types';
import { DocumentExpiryProcessor } from './document-expiry.processor';

export class DocumentExpiryWorker extends AbstractOrgWorker<DocumentExpiryPayload> {
    private readonly processor: DocumentExpiryProcessor;

    constructor(options?: { worker?: WorkerOptions; processor?: DocumentExpiryProcessor }) {
        // queueName: Using HR_COMPLIANCE_REMINDER as a shared queue for compliance tasks
        super({
            queueName: WORKER_QUEUE_NAMES.HR_COMPLIANCE_REMINDER,
            workerName: 'hr.compliance.document-expiry',
            schema: documentExpiryEnvelopeSchema,
        });
        this.processor = options?.processor ?? new DocumentExpiryProcessor();
    }

    protected async process(payload: DocumentExpiryPayload, context: RepositoryAuthorizationContext) {
        const result = await this.processor.process(payload, context);
        this.logger.info('hr.compliance.document-expiry.completed', {
            orgId: context.orgId,
            ...result
        });
        return result;
    }
}

export function registerDocumentExpiryWorker(options?: { worker?: WorkerOptions }) {
    const worker = new DocumentExpiryWorker(options);
    return worker.registerWorker(options?.worker);
}

