export interface LruCacheOptions {
    maxEntries: number;
    ttlMs: number;
}

interface LruCacheEntry<TValue> {
    value: TValue;
    expiresAt: number;
}

export class LruCache<TKey, TValue> {
    private readonly maxEntries: number;
    private readonly ttlMs: number;
    private readonly store = new Map<TKey, LruCacheEntry<TValue>>();

    constructor(options: LruCacheOptions) {
        this.maxEntries = Math.max(1, options.maxEntries);
        this.ttlMs = Math.max(0, options.ttlMs);
    }

    get(key: TKey): TValue | null {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        if (this.isExpired(entry)) {
            this.store.delete(key);
            return null;
        }
        this.store.delete(key);
        this.store.set(key, entry);
        return entry.value;
    }

    set(key: TKey, value: TValue): void {
        const entry: LruCacheEntry<TValue> = {
            value,
            expiresAt: this.ttlMs === 0 ? Number.POSITIVE_INFINITY : Date.now() + this.ttlMs,
        };

        if (this.store.has(key)) {
            this.store.delete(key);
        }

        this.store.set(key, entry);
        this.trim();
    }

    delete(key: TKey): void {
        this.store.delete(key);
    }

    clear(): void {
        this.store.clear();
    }

    private trim(): void {
        while (this.store.size > this.maxEntries) {
            const oldestKey = this.store.keys().next().value;
            if (oldestKey === undefined) {
                return;
            }
            this.store.delete(oldestKey);
        }
    }

    private isExpired(entry: LruCacheEntry<TValue>): boolean {
        return entry.expiresAt <= Date.now();
    }
}

export function createLruCache<TKey, TValue>(options: LruCacheOptions): LruCache<TKey, TValue> {
    return new LruCache<TKey, TValue>(options);
}