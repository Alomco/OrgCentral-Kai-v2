'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistStorage, createSafeStorage } from '@/lib/stores/storage';
import { ADMIN_BOOTSTRAP_SECRET_STORAGE_KEY } from './admin-bootstrap.storage';

const ADMIN_BOOTSTRAP_STORAGE_VERSION = 1;

interface AdminBootstrapState {
    token: string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
}

const baseStorage = createSafeStorage(typeof window === 'undefined' ? null : window.sessionStorage);
const persistStorage = createPersistStorage<Pick<AdminBootstrapState, 'token'>>(
    baseStorage,
    (raw) => (raw.trim().length > 0 ? { state: { token: raw }, version: 0 } : null),
);

export const useAdminBootstrapStore = create<AdminBootstrapState>()(
    persist(
        (set) => ({
            token: null,
            setToken: (token) => set({ token }),
            clearToken: () => set({ token: null }),
        }),
        {
            name: ADMIN_BOOTSTRAP_SECRET_STORAGE_KEY,
            storage: persistStorage,
            version: ADMIN_BOOTSTRAP_STORAGE_VERSION,
            migrate: (persistedState) => {
                const stored = persistedState as { token?: string } | null;
                const token = typeof stored?.token === 'string' && stored.token.trim().length > 0
                    ? stored.token
                    : null;
                return { token };
            },
            partialize: (state) => ({ token: state.token }),
            merge: (persistedState, currentState) => {
                const stored = persistedState as { token?: string } | null;
                const token = typeof stored?.token === 'string' && stored.token.trim().length > 0
                    ? stored.token
                    : currentState.token;
                return { ...currentState, token };
            },
        },
    ),
);
