import { appLogger } from '@/server/logging/structured-logger';

interface QueueOverflowAlertState {
    droppedSinceLastAlert: number;
    totalDropped: number;
    lastAlertAt: number;
}

interface QueueOverflowAlertRuntime {
    queueState: Map<string, QueueOverflowAlertState>;
}

interface QueueOverflowAlertInput {
    queueName: string;
    maxPendingJobs: number;
    droppedJobId?: string;
    droppedJobName?: string;
}

const OVERFLOW_ALERT_BATCH_SIZE = resolvePositiveInt(process.env.ORG_QUEUE_OVERFLOW_ALERT_BATCH_SIZE, 25);
const OVERFLOW_ALERT_COOLDOWN_MS = resolvePositiveInt(process.env.ORG_QUEUE_OVERFLOW_ALERT_COOLDOWN_MS, 60_000);

const overflowGlobal = globalThis as typeof globalThis & {
    __ORG_QUEUE_OVERFLOW_ALERT_RUNTIME__?: QueueOverflowAlertRuntime;
};

const overflowRuntime: QueueOverflowAlertRuntime = overflowGlobal.__ORG_QUEUE_OVERFLOW_ALERT_RUNTIME__ ?? {
    queueState: new Map<string, QueueOverflowAlertState>(),
};
overflowGlobal.__ORG_QUEUE_OVERFLOW_ALERT_RUNTIME__ = overflowRuntime;

export function emitQueuePendingOverflowAlert(input: QueueOverflowAlertInput): void {
    const now = Date.now();
    const state = overflowRuntime.queueState.get(input.queueName) ?? {
        droppedSinceLastAlert: 0,
        totalDropped: 0,
        lastAlertAt: 0,
    };

    state.droppedSinceLastAlert += 1;
    state.totalDropped += 1;

    const shouldAlert =
        state.totalDropped === 1 ||
        state.droppedSinceLastAlert >= OVERFLOW_ALERT_BATCH_SIZE ||
        now - state.lastAlertAt >= OVERFLOW_ALERT_COOLDOWN_MS;

    if (shouldAlert) {
        appLogger.error('queue.pending.capacity.alert', {
            queue: input.queueName,
            maxPendingJobs: input.maxPendingJobs,
            totalDropped: state.totalDropped,
            droppedSinceLastAlert: state.droppedSinceLastAlert,
            droppedJobId: input.droppedJobId,
            droppedJobName: input.droppedJobName,
            alertBatchSize: OVERFLOW_ALERT_BATCH_SIZE,
            alertCooldownMs: OVERFLOW_ALERT_COOLDOWN_MS,
            recommendedAction: 'Scale queue workers or raise maxPendingJobs with explicit approval.',
        });
        state.lastAlertAt = now;
        state.droppedSinceLastAlert = 0;
    }

    overflowRuntime.queueState.set(input.queueName, state);
}

export function clearQueuePendingOverflowAlertState(queueName: string): void {
    overflowRuntime.queueState.delete(queueName);
}

function resolvePositiveInt(rawValue: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(rawValue ?? '', 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}
