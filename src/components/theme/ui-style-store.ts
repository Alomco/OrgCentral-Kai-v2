'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistStorage, createSafeStorage, createScopedStorage } from '@/lib/stores/storage';
import { isUiStyleKey, type UiStyleKey } from '@/server/theme/ui-style-presets';
import { readOrgScope } from './org-scope';

const UI_STYLE_STORAGE_KEY = 'orgcentral-ui-style';
const UI_STYLE_STORAGE_VERSION = 1;

interface UiStyleStoreState {
    overrideStyle: UiStyleKey | null;
    setOverrideStyle: (style: UiStyleKey) => void;
    clearOverrideStyle: () => void;
}

const baseStorage = createSafeStorage(typeof window === 'undefined' ? null : window.localStorage);
const scopedStorage = createScopedStorage(baseStorage, readOrgScope);
const persistStorage = createPersistStorage<Pick<UiStyleStoreState, 'overrideStyle'>>(
    scopedStorage,
    (raw) => (isUiStyleKey(raw) ? { state: { overrideStyle: raw }, version: 0 } : null),
);

export const useUiStyleStore = create<UiStyleStoreState>()(
    persist(
        (set) => ({
            overrideStyle: null,
            setOverrideStyle: (style) => set({ overrideStyle: style }),
            clearOverrideStyle: () => set({ overrideStyle: null }),
        }),
        {
            name: UI_STYLE_STORAGE_KEY,
            storage: persistStorage,
            version: UI_STYLE_STORAGE_VERSION,
            migrate: (persistedState) => {
                const stored = persistedState as { overrideStyle?: string } | null;
                const overrideStyle = isUiStyleKey(stored?.overrideStyle ?? null)
                    ? stored?.overrideStyle ?? null
                    : null;
                return { overrideStyle };
            },
            partialize: (state) => ({ overrideStyle: state.overrideStyle }),
            merge: (persistedState, currentState) => {
                const stored = persistedState as { overrideStyle?: string } | null;
                const overrideStyle = isUiStyleKey(stored?.overrideStyle ?? null)
                    ? stored?.overrideStyle ?? null
                    : currentState.overrideStyle;
                return { ...currentState, overrideStyle };
            },
        },
    ),
);
