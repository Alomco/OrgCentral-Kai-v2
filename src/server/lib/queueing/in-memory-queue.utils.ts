import type { JobsOptions, RepeatOptions } from './in-memory-queue.types';

export function resolveIntervalMs(repeat: RepeatOptions): number {
    if (typeof repeat.every === 'number' && repeat.every > 0) {
        return repeat.every;
    }
    if (repeat.pattern) {
        return repeat.pattern.includes(' 1 ') || repeat.pattern.includes(' 2 1 ')
            ? 30 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
    }
    return 60 * 1000;
}

export function resolveBackoffDelayMs(backoff: JobsOptions['backoff'], attempt: number): number {
    if (typeof backoff === 'number') {
        return Math.max(0, backoff);
    }
    const baseDelay = Math.max(0, backoff?.delay ?? 0);
    if (backoff?.type === 'exponential' && baseDelay > 0) {
        return baseDelay * Math.pow(2, Math.max(0, attempt - 1));
    }
    return baseDelay;
}

export async function wait(ms: number): Promise<void> {
    if (ms <= 0) {
        return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
