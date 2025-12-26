'use client';

import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';

export function ThemeSwitcher() {
    const { currentTheme, setTheme, clearTheme, themes } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const swatchCss = themes
        .map((theme) => `.orgcentral-theme-swatch[data-theme-id="${theme.id}"]{background-color:${theme.color};}`)
        .join('\n');

    const handleThemeChange = (themeId: (typeof themes)[number]['id']) => {
        setTheme(themeId);
        setIsOpen(false);
    };

    const selectedLabel =
        currentTheme ? themes.find((t) => t.id === currentTheme)?.name : 'Organization theme';

    return (
        <div className="relative">
            <style dangerouslySetInnerHTML={{ __html: swatchCss }} />
            {/* Theme Switcher Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-linear-to-r from-primary/10 to-accent/10",
                    "border border-primary/20",
                    "hover:from-primary/20 hover:to-accent/20",
                    "transition-all duration-300",
                    "text-sm font-medium"
                )}
            >
                <Palette className="h-4 w-4" />
                <span>Switch Theme</span>
                <span className="px-2 py-0.5 rounded-md bg-primary/20 text-xs">
                    {selectedLabel}
                </span>
            </button>

            {/* Theme Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute top-full mt-2 right-0 z-50 w-80 rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-sm">Choose Your Theme</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Select a theme to instantly transform your experience
                            </p>
                        </div>

                        <div className="p-2 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => handleThemeChange(theme.id)}
                                        className={cn(
                                            "group relative p-3 rounded-lg border transition-all duration-300",
                                            "hover:scale-105 hover:shadow-lg",
                                            currentTheme === theme.id
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        {/* Color Preview */}
                                        <div
                                            className={cn(
                                                "orgcentral-theme-swatch h-12 rounded-md mb-2 transition-all duration-300 group-hover:scale-110"
                                            )}
                                            data-theme-id={theme.id}
                                        />

                                        {/* Theme Name */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium">{theme.name}</span>
                                            {currentTheme === theme.id && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 border-t border-border bg-muted/30">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">
                                    Preview applies instantly • Persists locally
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearTheme();
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "text-xs font-medium underline-offset-4 hover:underline",
                                        "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
