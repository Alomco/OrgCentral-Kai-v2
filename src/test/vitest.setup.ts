import '@testing-library/jest-dom/vitest';
/*
 * Test-only runtime setup.
 *
 * The current Prisma client in this repo is configured to use the "client" engine,
 * which requires an adapter/accelerateUrl at construction time.
 *
 * Most unit tests should not touch the DB at all, but they may import repository
 * base classes that import the Prisma singleton.
 *
 * To keep unit tests fast and hermetic, we mock the Prisma singleton module.
 */

import type { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

interface StorageLike {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
    clear: () => void;
    key: (index: number) => string | null;
    readonly length: number;
}

const createMemoryStorage = (): StorageLike => {
    const store = new Map<string, string>();
    return {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => {
            store.set(key, value);
        },
        removeItem: (key) => {
            store.delete(key);
        },
        clear: () => {
            store.clear();
        },
        key: (index) => Array.from(store.keys())[index] ?? null,
        get length() {
            return store.size;
        },
    } satisfies StorageLike;
};

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    Object.defineProperty(globalThis, 'localStorage', {
        value: createMemoryStorage(),
        configurable: true,
    });
}

if (typeof globalThis.sessionStorage === 'undefined' || typeof globalThis.sessionStorage.getItem !== 'function') {
    Object.defineProperty(globalThis, 'sessionStorage', {
        value: createMemoryStorage(),
        configurable: true,
    });
}

vi.mock('@/server/lib/prisma', () => {
    const prisma = new Proxy(
        {},
        {
            get() {
                throw new Error(
                    'Prisma client was accessed in a unit test. Mock the repository layer or add an integration test harness instead.'
                );
            },
        }
    ) as PrismaClient;

    return { prisma };
});

vi.mock('@/server/logging/audit-logger', () => ({
    recordAuditEvent: vi.fn(() => undefined),
    setAuditLogRepository: vi.fn(),
}));







vi.mock('next/navigation', () => ({
    useRouter: () => ({
        replace: vi.fn(),
        push: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    notFound: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: vi.fn(() => new Headers()),
}));