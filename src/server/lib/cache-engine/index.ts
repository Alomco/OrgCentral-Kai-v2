import type { CacheEngine, CacheEngineFactoryOptions } from '@/server/lib/cache-engine/types';
import { NextCacheEngine } from '@/server/lib/cache-engine/backends/next-cache-engine';

let singleton: CacheEngine | null = null;

export function getCacheEngine(options?: CacheEngineFactoryOptions): CacheEngine {
    void options;
    if (singleton) {
        return singleton;
    }
    singleton = new NextCacheEngine();
    return singleton;
}

export function resetCacheEngineForTests(): void {
    singleton = null;
}
