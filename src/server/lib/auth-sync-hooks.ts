import type { BetterAuthSessionPayload, BetterAuthUserPayload } from '@/server/lib/auth-sync';
import { appLogger } from '@/server/logging/structured-logger';

export interface AuthSyncQueueClient {
    enqueueUserSync: (user: BetterAuthUserPayload) => Promise<void>;
    enqueueSessionSync: (session: BetterAuthSessionPayload) => Promise<void>;
}

async function enqueueAuthSyncSafely(
    enqueue: () => Promise<void>,
    context: Record<string, string>,
): Promise<void> {
    try {
        await enqueue();
    } catch (error) {
        appLogger.warn('Auth sync enqueue failed', {
            ...context,
            error: String(error),
        });
    }
}

export function getAuthSyncQueueClientOrNull(
    isEnabled: boolean,
    factory: () => AuthSyncQueueClient,
): AuthSyncQueueClient | null {
    return isEnabled ? factory() : null;
}

export function createAuthDatabaseHooks(authSyncQueue: AuthSyncQueueClient | null) {
    return {
        user: {
            create: {
                after: async (user: BetterAuthUserPayload) => {
                    if (!authSyncQueue) {
                        return;
                    }
                    await enqueueAuthSyncSafely(
                        () => authSyncQueue.enqueueUserSync(user),
                        { entity: 'user', event: 'create' },
                    );
                },
            },
            update: {
                after: async (user: BetterAuthUserPayload) => {
                    if (!authSyncQueue) {
                        return;
                    }
                    await enqueueAuthSyncSafely(
                        () => authSyncQueue.enqueueUserSync(user),
                        { entity: 'user', event: 'update' },
                    );
                },
            },
        },
        session: {
            create: {
                after: async (session: BetterAuthSessionPayload) => {
                    if (!authSyncQueue) {
                        return;
                    }
                    await enqueueAuthSyncSafely(
                        () => authSyncQueue.enqueueSessionSync(session),
                        { entity: 'session', event: 'create' },
                    );
                },
            },
            update: {
                after: async (session: BetterAuthSessionPayload) => {
                    if (!authSyncQueue) {
                        return;
                    }
                    await enqueueAuthSyncSafely(
                        () => authSyncQueue.enqueueSessionSync(session),
                        { entity: 'session', event: 'update' },
                    );
                },
            },
        },
    } as const;
}
