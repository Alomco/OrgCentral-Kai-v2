'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistStorage, createSafeStorage, createScopedStorage } from '@/lib/stores/storage';
import { themePresets, type ThemePresetId } from '@/server/theme/theme-presets';
import { readOrgScope } from './org-scope';

export type ThemeId = ThemePresetId;

const THEME_STORAGE_KEY = 'orgcentral-theme';

interface ThemeStoreState {
    themeId: ThemeId | null;
    setThemeId: (themeId: ThemeId) => void;
    clearThemeId: () => void;
}

function isThemeId(value: string | null): value is ThemeId {
    return Boolean(value && Object.prototype.hasOwnProperty.call(themePresets, value));
}

const baseStorage = createSafeStorage(typeof window === 'undefined' ? null : window.localStorage);
const scopedStorage = createScopedStorage(baseStorage, readOrgScope);
const persistStorage = createPersistStorage<Pick<ThemeStoreState, 'themeId'>>(
    scopedStorage,
    (raw) => (isThemeId(raw) ? { state: { themeId: raw }, version: 0 } : null),
);

export const useThemeStore = create<ThemeStoreState>()(
    persist(
        (set) => ({
            themeId: null,
            setThemeId: (themeId) => set({ themeId }),
            clearThemeId: () => set({ themeId: null }),
        }),
        {
            name: THEME_STORAGE_KEY,
            storage: persistStorage,
            partialize: (state) => ({ themeId: state.themeId }),
            merge: (persistedState, currentState) => {
                const stored = persistedState as { themeId?: string } | null;
                const candidate = stored?.themeId ?? null;
                const themeId = isThemeId(candidate) ? candidate : currentState.themeId;
                return { ...currentState, themeId };
            },
        },
    ),
);
