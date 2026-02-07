import type { Job, WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { AbstractOrgWorker } from '@/server/workers/abstract-org-worker';
import { WORKER_QUEUE_NAMES } from '@/server/lib/worker-constants';
import {
    notificationDispatchEnvelopeSchema,
    type NotificationDispatchPayload,
    NOTIFICATION_DISPATCH_JOB_NAME,
} from '@/server/workers/notifications/dispatch.types';
import {
    getNotificationService,
    type NotificationServiceContract,
} from '../../services/notifications/notification-service.provider';

export interface NotificationDispatchWorkerOptions {
    worker?: WorkerOptions;
    notificationService?: NotificationServiceContract;
}

export class NotificationDispatchWorker extends AbstractOrgWorker<NotificationDispatchPayload> {
    private readonly notificationService: NotificationServiceContract;

    constructor(options?: NotificationDispatchWorkerOptions) {
        super({
            queueName: WORKER_QUEUE_NAMES.NOTIFICATIONS_DISPATCH,
            workerName: NOTIFICATION_DISPATCH_JOB_NAME,
            schema: notificationDispatchEnvelopeSchema,
        });
        this.notificationService = options?.notificationService ?? getNotificationService();
    }

    protected async process(
        payload: NotificationDispatchPayload,
        context: RepositoryAuthorizationContext,
        job: Job,
    ): Promise<void> {
        await this.notificationService.sendNotification({
            authorization: context,
            notification: payload,
            jobId: job.id,
        });
    }
}

export function registerNotificationDispatchWorker(options?: NotificationDispatchWorkerOptions) {
    const worker = new NotificationDispatchWorker(options);
    return worker.registerWorker(options?.worker);
}

