'use client';

import type { PersistStorage, StateStorage, StorageValue } from 'zustand/middleware';

type LegacyParser<S> = (raw: string) => StorageValue<S> | null;

const noopStorage: StateStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export function createSafeStorage(storage: Storage | null): StateStorage {
    if (!storage) {
        return noopStorage;
    }
    return {
        getItem: (name) => {
            try {
                return storage.getItem(name);
            } catch {
                return null;
            }
        },
        setItem: (name, value) => {
            try {
                storage.setItem(name, value);
            } catch {
                // ignore storage failures
            }
        },
        removeItem: (name) => {
            try {
                storage.removeItem(name);
            } catch {
                // ignore storage failures
            }
        },
    };
}

export function createScopedStorage(storage: StateStorage, scopeKey: () => string): StateStorage {
    return {
        getItem: (name) => storage.getItem(`${name}:${scopeKey()}`),
        setItem: (name, value) => storage.setItem(`${name}:${scopeKey()}`, value),
        removeItem: (name) => storage.removeItem(`${name}:${scopeKey()}`),
    };
}

export function createPersistStorage<S>(
    storage: StateStorage,
    legacyParser?: LegacyParser<S>,
): PersistStorage<S> {
    const parseRaw = (raw: string | null): StorageValue<S> | null => {
        if (!raw) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (parsed && typeof parsed === 'object' && 'state' in parsed) {
                return parsed as StorageValue<S>;
            }
            if (typeof parsed === 'string' && legacyParser) {
                return legacyParser(parsed);
            }
        } catch {
            // fall through to legacy parsing
        }
        return legacyParser ? legacyParser(raw) : null;
    };

    return {
        getItem: (name) => {
            const raw = storage.getItem(name);
            if (raw instanceof Promise) {
                return raw.then(parseRaw);
            }
            return parseRaw(raw);
        },
        setItem: (name, value) => storage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => storage.removeItem(name),
    };
}
