/**
 * 🎨 UI Style Provider
 * 
 * Client-side provider for UI style switching via data-ui-style attribute.
 * Works alongside ThemeProvider for color theming.
 * 
 * @module components/theme/ui-style-provider
 */

'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { uiStylePresets, uiStyleKeys, defaultUiStyle, getUiStyleCssVariables, type UiStyleKey } from '@/server/theme/ui-style-presets';

// ============================================================================
// Types
// ============================================================================

interface UiStyleContextValue {
    /** Current UI style */
    currentStyle: UiStyleKey;
    /** Set UI style */
    setStyle: (styleKey: UiStyleKey) => void;
    /** Reset to default */
    clearStyle: () => void;
    /** Available styles */
    styles: readonly {
        id: UiStyleKey;
        name: string;
        emoji: string;
        description: string;
    }[];
}

// ============================================================================
// Context
// ============================================================================

const UiStyleContext = createContext<UiStyleContextValue | undefined>(undefined);

const UI_STYLE_STORAGE_KEY = 'orgcentral-ui-style';
const UI_STYLE_CHANGE_EVENT = 'orgcentral-ui-style-change';

// ============================================================================
// Storage & Events
// ============================================================================

function readStoredStyle(): UiStyleKey {
    try {
        const value = localStorage.getItem(UI_STYLE_STORAGE_KEY);
        return value && uiStyleKeys.includes(value) ? (value) : defaultUiStyle;
    } catch {
        return defaultUiStyle;
    }
}

function subscribeToStyleChanges(onStoreChange: () => void) {
    const handler = () => onStoreChange();
    window.addEventListener('storage', handler);
    window.addEventListener(UI_STYLE_CHANGE_EVENT, handler);
    return () => {
        window.removeEventListener('storage', handler);
        window.removeEventListener(UI_STYLE_CHANGE_EVENT, handler);
    };
}

// ============================================================================
// Export presets for UI consumption
// ============================================================================

export const UI_STYLE_OPTIONS = uiStyleKeys.map((key) => ({
    id: key,
    name: uiStylePresets[key].name,
    emoji: uiStylePresets[key].emoji,
    description: uiStylePresets[key].description,
}));

// ============================================================================
// Provider
// ============================================================================

export function UiStyleProvider({ children }: { children: ReactNode }) {
    const storedStyle = useSyncExternalStore(
        subscribeToStyleChanges,
        readStoredStyle,
        () => defaultUiStyle,
    );

    const applyStyleToDOM = (styleKey: UiStyleKey) => {
        const cssVariables = getUiStyleCssVariables(styleKey);
        const root = document.documentElement;
        const body = document.body;

        Object.entries(cssVariables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Also set the data attribute for potential specific overrides
        root.dataset.uiStyle = styleKey;
        body.dataset.uiStyle = styleKey;
    };

    // Apply style to DOM on mount and change
    useEffect(() => {
        applyStyleToDOM(storedStyle);
    }, [storedStyle]);

    const setStyle = (styleKey: UiStyleKey) => {
        localStorage.setItem(UI_STYLE_STORAGE_KEY, styleKey);
        applyStyleToDOM(styleKey);
        window.dispatchEvent(new Event(UI_STYLE_CHANGE_EVENT));
    };

    const clearStyle = () => {
        localStorage.removeItem(UI_STYLE_STORAGE_KEY);
        applyStyleToDOM(defaultUiStyle);
        window.dispatchEvent(new Event(UI_STYLE_CHANGE_EVENT));
    };

    return (
        <UiStyleContext.Provider value={{
            currentStyle: storedStyle,
            setStyle,
            clearStyle,
            styles: UI_STYLE_OPTIONS,
        }}>
            {children}
        </UiStyleContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useUiStyle() {
    const context = useContext(UiStyleContext);
    if (!context) {
        throw new Error('useUiStyle must be used within UiStyleProvider');
    }
    return context;
}
