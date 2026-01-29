'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistStorage, createSafeStorage } from '@/lib/stores/storage';

export type DevelopmentThemePreset = 'server' | 'demo';

const STORAGE_KEY = 'orgcentral:dev-theme-preset';

interface DevelopmentThemeState {
    preset: DevelopmentThemePreset;
    setPreset: (preset: DevelopmentThemePreset) => void;
}

const baseStorage = createSafeStorage(typeof window === 'undefined' ? null : window.localStorage);
const persistStorage = createPersistStorage<Pick<DevelopmentThemeState, 'preset'>>(
    baseStorage,
    (raw) => (raw === 'demo' || raw === 'server' ? { state: { preset: raw }, version: 0 } : null),
);

export const useDevelopmentThemeStore = create<DevelopmentThemeState>()(
    persist(
        (set) => ({
            preset: 'server',
            setPreset: (preset) => set({ preset }),
        }),
        {
            name: STORAGE_KEY,
            storage: persistStorage,
            partialize: (state) => ({ preset: state.preset }),
            merge: (persistedState, currentState) => {
                const stored = persistedState as { preset?: string } | null;
                const preset = stored?.preset === 'demo' || stored?.preset === 'server'
                    ? stored.preset
                    : currentState.preset;
                return { ...currentState, preset };
            },
        },
    ),
);
