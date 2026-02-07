interface QueueRuntimeLifecycleState {
    cleanupHandlers: Map<string, () => Promise<void>>;
    cleanupPromise?: Promise<void>;
    handlersAttached: boolean;
}

const lifecycleGlobal = globalThis as typeof globalThis & {
    __ORG_QUEUE_RUNTIME_LIFECYCLE__?: QueueRuntimeLifecycleState;
};

const lifecycleState: QueueRuntimeLifecycleState = lifecycleGlobal.__ORG_QUEUE_RUNTIME_LIFECYCLE__ ?? {
    cleanupHandlers: new Map<string, () => Promise<void>>(),
    handlersAttached: false,
};

lifecycleGlobal.__ORG_QUEUE_RUNTIME_LIFECYCLE__ = lifecycleState;

export function registerQueueRuntimeCleanup(
    id: string,
    cleanupHandler: () => Promise<void>,
): void {
    lifecycleState.cleanupHandlers.set(id, cleanupHandler);
    attachProcessHandlers();
}

export async function runQueueRuntimeCleanup(): Promise<void> {
    if (lifecycleState.cleanupPromise) {
        return lifecycleState.cleanupPromise;
    }

    const handlers = Array.from(lifecycleState.cleanupHandlers.values());
    lifecycleState.cleanupPromise = Promise.allSettled(handlers.map((handler) => handler())).then(() => {
        lifecycleState.cleanupPromise = undefined;
    });

    return lifecycleState.cleanupPromise;
}

function attachProcessHandlers(): void {
    if (lifecycleState.handlersAttached || typeof process === 'undefined' || typeof process.once !== 'function') {
        return;
    }

    const triggerCleanup = () => {
        runQueueRuntimeCleanup().catch(() => undefined);
    };

    process.once('beforeExit', triggerCleanup);
    process.once('SIGINT', triggerCleanup);
    process.once('SIGTERM', triggerCleanup);
    lifecycleState.handlersAttached = true;
}
