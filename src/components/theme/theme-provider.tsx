
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { converter, parse } from 'culori';
import { ORG_SCOPE_CHANGE_EVENT } from './org-scope';
import { subscribeGlobalEventListener } from '@/lib/dom/global-event-listeners';
import { useThemeStore, type ThemeId } from './theme-store';

import { getThemePreset, themePresets } from '@/server/theme/theme-presets';
import { themeTokenKeys } from '@/server/theme/tokens';

export type { ThemeId };

interface ThemeContextValue {
    /** Local preview override. When null, the org/server theme is in effect. */
    currentTheme: ThemeId | null;
    setTheme: (themeId: ThemeId) => void;
    clearTheme: () => void;
    themes: readonly {
        id: ThemeId;
        name: string;
        color: string;
    }[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface OklchColor {
    l?: number;
    c?: number;
    h?: number;
}

const toOklch = converter('oklch');

function formatOklchToken(color: OklchColor): string | null {
    if (typeof color.l !== 'number' || typeof color.c !== 'number') {
        return null;
    }

    const l = color.l.toFixed(4);
    const c = color.c.toFixed(4);
    const h = Number.isFinite(color.h) ? Number(color.h).toFixed(2) : '0';

    return `${l} ${c} ${h}`;
}

function toOklchToken(value: string): string {
    const parsedOklch = parse(`oklch(${value})`);
    const oklchFromOklch = parsedOklch ? toOklch(parsedOklch) : null;
    const oklchToken = oklchFromOklch ?? toOklch(`hsl(${value})`);

    const formatted = oklchToken ? formatOklchToken(oklchToken) : null;
    return formatted ?? value;
}

function toCssOklch(value: string): string {
    return `oklch(${toOklchToken(value)})`;
}

export const THEME_PRESETS = Object.values(themePresets).map((preset) => ({
    id: preset.id as ThemeId,
    name: preset.name,
    color: toCssOklch(preset.tokens.primary),
})) as readonly { id: ThemeId; name: string; color: string }[];

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { theme: mode, resolvedTheme } = useNextTheme();
    const storedTheme = useThemeStore((state) => state.themeId);
    const setThemeId = useThemeStore((state) => state.setThemeId);
    const clearThemeId = useThemeStore((state) => state.clearThemeId);

    const themes = useMemo(() => THEME_PRESETS, []);

    const resolvedMode = resolvedTheme ?? (mode === 'dark' ? 'dark' : 'light');
    const activeMode: 'light' | 'dark' = resolvedMode === 'dark' ? 'dark' : 'light';

    const applyThemeDataAttributes = useCallback((themeId: ThemeId | null, themeMode: 'light' | 'dark') => {
        const root = document.documentElement;
        const body = document.body;

        if (themeId) {
            root.dataset.theme = themeId;
            body.dataset.theme = themeId;
        } else {
            delete root.dataset.theme;
            delete body.dataset.theme;
        }

        root.dataset.themeMode = themeMode;
        body.dataset.themeMode = themeMode;
    }, []);

    const applyThemeToDOM = useCallback((themeId: ThemeId, themeMode: 'light' | 'dark') => {
        const preset = getThemePreset(themeId);
        const tokens = themeMode === 'dark' ? preset.darkTokens : preset.tokens;
        const root = document.documentElement;

        Object.entries(tokens).forEach(([key, value]) => {
            if (typeof value === 'string' && value.length > 0) {
                root.style.setProperty(`--${key}`, toOklchToken(value));
            }
        });

        applyThemeDataAttributes(themeId, themeMode);
    }, [applyThemeDataAttributes]);

    const clearThemeFromDOM = useCallback((themeMode: 'light' | 'dark') => {
        const root = document.documentElement;
        themeTokenKeys.forEach((key) => {
            root.style.removeProperty(`--${key}`);
        });
        applyThemeDataAttributes(null, themeMode);
    }, [applyThemeDataAttributes]);

    useEffect(() => {
        const handleRehydrate = () => {
            Promise.resolve(useThemeStore.persist.rehydrate()).catch(() => null);
        };

        const unsubscribeStorage = subscribeGlobalEventListener({
            key: 'window:storage:theme',
            target: window,
            type: 'storage',
            handler: handleRehydrate,
        });
        const unsubscribeOrgScope = subscribeGlobalEventListener({
            key: `window:${ORG_SCOPE_CHANGE_EVENT}:theme`,
            target: window,
            type: ORG_SCOPE_CHANGE_EVENT,
            handler: handleRehydrate,
        });

        return () => {
            unsubscribeStorage();
            unsubscribeOrgScope();
        };
    }, []);

    useEffect(() => {
        // Only override tenant-provided theme when a user has explicitly picked one.
        if (!storedTheme) {
            clearThemeFromDOM(activeMode);
            return;
        }

        applyThemeToDOM(storedTheme, activeMode);
    }, [activeMode, storedTheme, applyThemeToDOM, clearThemeFromDOM]);

    const setTheme = (themeId: ThemeId) => {
        setThemeId(themeId);
        applyThemeToDOM(themeId, activeMode);
    };

    const clearTheme = () => {
        clearThemeId();
        clearThemeFromDOM(activeMode);
    };

    return (
        <ThemeContext.Provider value={{ currentTheme: storedTheme, setTheme, clearTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
