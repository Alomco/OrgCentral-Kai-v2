import type { WorkerOptions } from '@/server/lib/queueing/in-memory-queue';
import { registerTrainingReminderWorker } from '@/server/workers/hr/training/reminder.worker';
import { shutdownQueueRegistry } from '@/server/workers/config/queue-registry';

const concurrency = Number.parseInt(process.env.WORKER_CONCURRENCY ?? '', 10);
const workerOptions: WorkerOptions | undefined =
    Number.isFinite(concurrency) && concurrency > 0 ? ({ concurrency } as WorkerOptions) : undefined;

const worker = registerTrainingReminderWorker({ worker: workerOptions });

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    console.info(`Shutting down training reminder worker due to ${signal}`);
    await worker.close();
    await shutdownQueueRegistry();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
