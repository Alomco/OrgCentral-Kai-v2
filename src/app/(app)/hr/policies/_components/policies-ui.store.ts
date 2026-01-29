"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPersistStorage, createSafeStorage } from '@/lib/stores/storage';

interface PoliciesUiState {\n  // Persist small UI prefs only; no server data\n  nocatDefault: boolean; // whether we disable auto category mapping by default\n  density: 'comfortable' | 'compact';\n  pageSize: number;\n  setNocatDefault: (v: boolean) => void;\n  setDensity: (v: 'comfortable' | 'compact') => void;\n  setPageSize: (n: number) => void;\n}

export const usePoliciesUiStore = create<PoliciesUiState>()(
  persist(
    (set) => ({\n      nocatDefault: false,\n      density: 'comfortable',\n      pageSize: 25,\n      setNocatDefault: (v) => set({ nocatDefault: v }),\n      setDensity: (v) => set({ density: v }),\n      setPageSize: (n) => set({ pageSize: n }),\n    }),
    }),
    {
      name: 'ui:hr:policies',
      storage: createPersistStorage(createSafeStorage(typeof window !== 'undefined' ? window.localStorage : null)),
      version: 1,
    },
  ),
);

