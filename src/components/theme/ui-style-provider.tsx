/**
 * 🎨 UI Style Provider with SSR Support
 * 
 * Client-side provider for UI style switching via data-ui-style attribute.
 * Uses blocking script to apply styles BEFORE React hydration to prevent flash.
 * Works alongside ThemeProvider for color theming.
 * 
 * @module components/theme/ui-style-provider
 */

'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { uiStylePresets, uiStyleKeys, defaultUiStyle, getUiStyleCssVariables, isUiStyleKey, type UiStyleKey } from '@/server/theme/ui-style-presets';
import { ORG_SCOPE_CHANGE_EVENT } from './org-scope';
import { useUiStyleStore } from './ui-style-store';
import { subscribeGlobalEventListener } from '@/lib/dom/global-event-listeners';

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

const UI_STYLE_STORAGE_KEY_PREFIX = 'orgcentral-ui-style:';
const UI_STYLE_CHANGE_EVENT = 'orgcentral-ui-style-change';

function readServerStyle(): UiStyleKey {
    try {
        const value = document.documentElement.dataset.uiStyle ?? null;
        return isUiStyleKey(value) ? value : defaultUiStyle;
    } catch {
        return defaultUiStyle;
    }
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
// SSR-Safe Blocking Script
// This script runs BEFORE React hydration to prevent flash of unstyled content
// ============================================================================

function generateBlockingScript(): string {
    // Build a map of all preset CSS variables
    const presetsMap: Record<string, Record<string, string>> = {};
    for (const key of uiStyleKeys) {
        presetsMap[key] = getUiStyleCssVariables(key);
    }

    // Self-executing function that runs immediately on page load
    return `(function(){
try {
    var STORAGE_KEY_PREFIX = '${UI_STYLE_STORAGE_KEY_PREFIX}';
    var DEFAULT_STYLE = '${defaultUiStyle}';
    var PRESETS = ${JSON.stringify(presetsMap)};
    var VALID_KEYS = ${JSON.stringify(uiStyleKeys)};

    var root = document.documentElement;
    var orgId = root.dataset.orgId || 'default';
    var storageKey = STORAGE_KEY_PREFIX + orgId;

    // Read from localStorage (zustand persist)
    var stored = null;
    var storedStyle = null;
    try { stored = localStorage.getItem(storageKey); } catch(e) {}
    if (stored) {
        try {
            var parsed = JSON.parse(stored);
            if (parsed && parsed.state && typeof parsed.state.overrideStyle === 'string') {
                storedStyle = parsed.state.overrideStyle;
            } else if (typeof parsed === 'string') {
                storedStyle = parsed;
            }
        } catch(e) {
            storedStyle = stored;
        }
    }
    var styleKey = (storedStyle && VALID_KEYS.indexOf(storedStyle) !== -1) ? storedStyle : null;
    var serverStyle = root.dataset.uiStyle;
    if (!styleKey && serverStyle && VALID_KEYS.indexOf(serverStyle) !== -1) {
        styleKey = serverStyle;
    }
    if (!styleKey) {
        styleKey = DEFAULT_STYLE;
    }

    // Apply CSS variables to root
    var vars = PRESETS[styleKey];
    if (vars) {
        for (var key in vars) {
            if (vars.hasOwnProperty(key)) {
                root.style.setProperty(key, vars[key]);
            }
        }
    }

    // Set data attribute for CSS selectors
    root.dataset.uiStyle = styleKey;
    if (document.body) {
        document.body.dataset.uiStyle = styleKey;
    }
} catch(e) {}
})();`;
}

// ============================================================================
// Provider
// ============================================================================

export function UiStyleProvider({ children }: { children: ReactNode }) {
    const [serverStyle, setServerStyle] = useState<UiStyleKey>(() => readServerStyle());
    const overrideStyle = useUiStyleStore((state) => state.overrideStyle);
    const setOverrideStyle = useUiStyleStore((state) => state.setOverrideStyle);
    const clearOverrideStyle = useUiStyleStore((state) => state.clearOverrideStyle);
    const resolvedStyle = overrideStyle ?? serverStyle;

    // Generate blocking script for SSR
    const blockingScript = useMemo(() => generateBlockingScript(), []);

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
        const handleUpdate = () => {
            Promise.resolve(useUiStyleStore.persist.rehydrate()).catch(() => {
                // ignore hydration errors
            });
            setServerStyle(readServerStyle());
        };

        const unsubscribeStorage = subscribeGlobalEventListener({
            key: 'window:storage:ui-style',
            target: window,
            type: 'storage',
            handler: handleUpdate,
        });
        const unsubscribeUiStyle = subscribeGlobalEventListener({
            key: `window:${UI_STYLE_CHANGE_EVENT}:ui-style`,
            target: window,
            type: UI_STYLE_CHANGE_EVENT,
            handler: handleUpdate,
        });
        const unsubscribeOrgScope = subscribeGlobalEventListener({
            key: `window:${ORG_SCOPE_CHANGE_EVENT}:ui-style`,
            target: window,
            type: ORG_SCOPE_CHANGE_EVENT,
            handler: handleUpdate,
        });

        return () => {
            unsubscribeStorage();
            unsubscribeUiStyle();
            unsubscribeOrgScope();
        };
    }, []);

    useEffect(() => {
        applyStyleToDOM(resolvedStyle);
    }, [resolvedStyle]);

    const setStyle = (styleKey: UiStyleKey) => {
        setOverrideStyle(styleKey);
        applyStyleToDOM(styleKey);
    };

    const clearStyle = () => {
        clearOverrideStyle();
        const nextStyle = readServerStyle();
        setServerStyle(nextStyle);
        applyStyleToDOM(nextStyle);
    };

    return (
        <UiStyleContext.Provider value={{
            currentStyle: resolvedStyle,
            setStyle,
            clearStyle,
            styles: UI_STYLE_OPTIONS,
        }}>
            {/* Blocking script runs BEFORE React hydration */}
            <script
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: blockingScript }}
            />
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
