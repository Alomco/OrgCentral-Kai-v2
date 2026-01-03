"use client";

import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeTogglePanel() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = mounted ? (theme ?? 'system') : null;

    const themes = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'system', label: 'System', icon: Monitor },
    ] as const;

    return (
        <article
            suppressHydrationWarning
            className="rounded-2xl border border-emerald-900/70 bg-emerald-950/40 p-4 shadow-lg shadow-black/20"
        >
            <Sun className="h-5 w-5 text-emerald-200" />
            <h2 className="mt-3 text-lg font-semibold text-emerald-100">Theme Control</h2>
            <p className="mt-2 text-sm text-emerald-200/70">
                Toggle between light, dark, and system themes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                {themes.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTheme(id)}
                        disabled={!mounted}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${mounted && currentTheme === id
                                ? 'border-emerald-500 bg-emerald-900/50 text-emerald-100'
                                : 'border-emerald-800 text-emerald-300/70 hover:border-emerald-600 hover:text-emerald-100'
                            } ${mounted ? '' : 'opacity-60'}`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>
            <div className="mt-3">
                <span className="inline-flex rounded-full border border-emerald-900 px-2.5 py-1 text-xs text-emerald-300/70">
                    Current: {currentTheme ?? 'loading'}
                </span>
            </div>
        </article>
    );
}
