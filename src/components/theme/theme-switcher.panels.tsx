'use client';

import type { LucideIcon } from 'lucide-react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ThemeOption, KeyNavList } from './theme-switcher.utils';
import { FOCUS_RING_CLASSES, handleRadioKeyDown } from './theme-switcher.utils';

export interface ModeOption { id: 'light' | 'dark' | 'system'; label: string; icon: LucideIcon; }

interface ModePanelProps {
    modeOptions: readonly ModeOption[];
    currentMode: ModeOption['id'];
    onSelect: (mode: ModeOption['id']) => void;
    setOpen: (open: boolean) => void;
}

export function ModePanel({ modeOptions, currentMode, onSelect, setOpen }: ModePanelProps) {
    return (
        <div className="p-3 space-y-2" role="radiogroup" aria-label="Select display mode">
            {modeOptions.map(({ id, label, icon: Icon }) => (
                currentMode === id ? (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked="true"
                        onClick={() => {
                            onSelect(id);
                            setOpen(false);
                        }}
                        onKeyDown={(event) => handleRadioKeyDown(event, modeOptions, currentMode, onSelect)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all',
                            'border-primary bg-primary/5 text-primary',
                            FOCUS_RING_CLASSES,
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{label}</span>
                        <Check className="ml-auto h-4 w-4" />
                    </button>
                ) : (
                    <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked="false"
                        onClick={() => {
                            onSelect(id);
                            setOpen(false);
                        }}
                        onKeyDown={(event) => handleRadioKeyDown(event, modeOptions, currentMode, onSelect)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all',
                            'border-border/50 hover:border-primary/40 hover:bg-muted/50',
                            FOCUS_RING_CLASSES,
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{label}</span>
                    </button>
                )
            ))}
        </div>
    );
}

interface ColorPanelProps<TThemeId extends string> {
    themes: readonly ThemeOption[];
    currentTheme: TThemeId | null;
    onSelect: (themeId: TThemeId) => void;
    setOpen: (open: boolean) => void;
}

export function ColorPanel<TThemeId extends string = string>({
    themes,
    currentTheme,
    onSelect,
    setOpen,
}: ColorPanelProps<TThemeId>) {
    const activeThemeId: TThemeId = currentTheme ?? (themes[0]?.id as TThemeId);
    const navItems: KeyNavList<TThemeId> = themes.map((theme) => ({ id: theme.id as TThemeId }));

    return (
        <div className="p-2 max-h-72 overflow-y-auto" role="radiogroup" aria-label="Select color theme">
            <div className="grid grid-cols-2 gap-2">
                {themes.map((theme) => {
                    const themeId = theme.id as TThemeId;
                    const isSelected = currentTheme === themeId;

                    return isSelected ? (
                        <button
                            key={theme.id}
                            type="button"
                            role="radio"
                            aria-checked="true"
                            onClick={() => {
                                onSelect(themeId);
                                setOpen(false);
                            }}
                            onKeyDown={(event) => handleRadioKeyDown(event, navItems, activeThemeId, onSelect)}
                            className={cn(
                                'group relative w-full rounded-lg border p-3 text-left transition-all duration-200',
                                'hover:scale-[1.02]',
                                'border-primary bg-primary/5',
                                FOCUS_RING_CLASSES,
                            )}
                        >
                            <div className="orgcentral-theme-swatch mb-2 h-10 w-full rounded-md" data-theme-id={theme.id} />
                            <div className="flex items-center justify-between">
                                <span className="truncate text-xs font-medium">{theme.name}</span>
                                <Check className="h-3 w-3 shrink-0 text-primary" />
                            </div>
                        </button>
                    ) : (
                        <button
                            key={theme.id}
                            type="button"
                            role="radio"
                                aria-checked="false"
                            onClick={() => {
                                onSelect(themeId);
                                setOpen(false);
                            }}
                            onKeyDown={(event) => handleRadioKeyDown(event, navItems, activeThemeId, onSelect)}
                            className={cn(
                                'group relative w-full rounded-lg border p-3 text-left transition-all duration-200',
                                'hover:scale-[1.02]',
                                'border-border/50 hover:border-primary/50',
                                FOCUS_RING_CLASSES,
                            )}
                        >
                            <div className="orgcentral-theme-swatch mb-2 h-10 w-full rounded-md" data-theme-id={theme.id} />
                            <div className="flex items-center justify-between">
                                <span className="truncate text-xs font-medium">{theme.name}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface StylePanelProps {
    styles: readonly { id: string; name: string; description: string; emoji: string }[];
    currentStyle: string;
    onSelect: (styleId: string) => void;
    setOpen: (open: boolean) => void;
}

export function StylePanel({ styles, currentStyle, onSelect, setOpen }: StylePanelProps) {
    return (
        <div className="p-2 max-h-72 space-y-1 overflow-y-auto" role="radiogroup" aria-label="Select UI style">
            {styles.map((style) => (
                currentStyle === style.id ? (
                    <button
                        key={style.id}
                        type="button"
                        role="radio"
                        aria-checked="true"
                        onClick={() => {
                            onSelect(style.id);
                            setOpen(false);
                        }}
                        onKeyDown={(event) => handleRadioKeyDown(event, styles, currentStyle, onSelect)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                            'border-primary bg-primary/5',
                            FOCUS_RING_CLASSES,
                        )}
                    >
                        <span className="text-xl shrink-0">{style.emoji}</span>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{style.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                                {style.description}
                            </div>
                        </div>
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                    </button>
                ) : (
                    <button
                        key={style.id}
                        type="button"
                        role="radio"
                        aria-checked="false"
                        onClick={() => {
                            onSelect(style.id);
                            setOpen(false);
                        }}
                        onKeyDown={(event) => handleRadioKeyDown(event, styles, currentStyle, onSelect)}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                            'border-border/50 hover:border-primary/40 hover:bg-muted/50',
                            FOCUS_RING_CLASSES,
                        )}
                    >
                        <span className="text-xl shrink-0">{style.emoji}</span>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{style.name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                                {style.description}
                            </div>
                        </div>
                    </button>
                )
            ))}
        </div>
    );
}
