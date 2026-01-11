import { Worker, type Job, type Processor, type WorkerOptions } from 'bullmq';
import type { ZodType } from 'zod';
import type { CacheScope } from '@/server/lib/cache-tags';
import {
    RepositoryAuthorizer,
    type RepositoryAuthorizationContext,
} from '@/server/repositories/security';
import { AbstractBaseService, type ServiceExecutionContext } from '@/server/services/abstract-base-service';
import type { OrgAccessInput } from '@/server/security/guards';
import type { WorkerQueueName } from '@/server/lib/worker-constants';
import { getQueue, type QueueRegistryOptions } from '@/server/lib/queue-registry';

export interface WorkerJobMetadata {
    correlationId?: string;
    cacheScopes?: CacheScope[];
    attributes?: Record<string, unknown>;
}

export type WorkerJobAuthorization = Omit<OrgAccessInput, 'orgId'>;

export interface WorkerJobEnvelope<TPayload> {
    orgId: string;
    payload: TPayload;
    authorization: WorkerJobAuthorization;
    metadata?: WorkerJobMetadata;
}

export interface OrgWorkerConfig<TPayload, TEnvelope extends WorkerJobEnvelope<TPayload>> {
    queueName: WorkerQueueName;
    workerName: string;
    schema: ZodType<TEnvelope>;
    queueOptions?: QueueRegistryOptions;
    authorizer?: RepositoryAuthorizer;
}

export abstract class AbstractOrgWorker<
    TPayload,
    TEnvelope extends WorkerJobEnvelope<TPayload> = WorkerJobEnvelope<TPayload>,
> extends AbstractBaseService {
    private readonly schema: ZodType<TEnvelope>;
    private readonly workerName: string;
    private readonly queueName: WorkerQueueName;
    private readonly queueOptions?: QueueRegistryOptions;
    private readonly authorizer: RepositoryAuthorizer;

    protected constructor(config: OrgWorkerConfig<TPayload, TEnvelope>) {
        super();
        this.schema = config.schema;
        this.workerName = config.workerName;
        this.queueName = config.queueName;
        this.queueOptions = config.queueOptions;
        this.authorizer = config.authorizer ?? RepositoryAuthorizer.default();
    }

    protected abstract process(
        payload: TPayload,
        context: RepositoryAuthorizationContext,
        job: Job<TEnvelope>,
    ): Promise<unknown>;

    registerWorker(workerOptions?: WorkerOptions): Worker {
        const queue = getQueue(this.queueName, this.queueOptions);
        const processor: Processor<TEnvelope> = async (job) => {
            const envelope = this.schema.parse(job.data);
            const authorizationContext = await this.authorizer.authorize(
                this.buildOrgAccessInput(envelope),
                (context) => Promise.resolve(context),
            );
            const serviceContext = this.buildServiceContext(envelope, authorizationContext, job);
            return this.executeInServiceContext(serviceContext, `${this.workerName}.process`, () =>
                this.process(envelope.payload, authorizationContext, job),
            );
        };

        return new Worker(queue.name, processor, {
            connection: queue.opts.connection,
            concurrency: workerOptions?.concurrency ?? 2,
            ...workerOptions,
        });
    }

    private buildOrgAccessInput(envelope: TEnvelope): OrgAccessInput {
        const { authorization, orgId } = envelope;
        return {
            ...authorization,
            orgId,
        } satisfies OrgAccessInput;
    }

    private buildServiceContext(
        envelope: TEnvelope,
        authorization: RepositoryAuthorizationContext,
        job: Job<TEnvelope>,
    ): ServiceExecutionContext {
        const correlationId =
            envelope.metadata?.correlationId ??
            envelope.authorization.correlationId ??
            authorization.correlationId;
        return {
            authorization,
            correlationId,
            metadata: {
                queue: this.queueName,
                jobId: job.id,
                jobName: job.name,
                attemptsMade: job.attemptsMade,
                cacheScopes: envelope.metadata?.cacheScopes,
                ...envelope.metadata?.attributes,
            },
        } satisfies ServiceExecutionContext;
    }
}
