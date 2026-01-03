'use client';

import { useMemo, useState } from 'react';
import { Monitor, Moon, Palette, Check, Sparkles, RotateCcw, Sun } from 'lucide-react';
import { useTheme as useNextTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { useTheme as useColorTheme } from './theme-provider';
import { useUiStyle } from './ui-style-provider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const FOCUS_RING_CLASSES = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function ThemeSwitcher() {
    const { currentTheme, setTheme: setColorTheme, clearTheme, themes } = useColorTheme();
    const { currentStyle, setStyle, clearStyle, styles } = useUiStyle();
    const { theme: mode, resolvedTheme, setTheme: setMode } = useNextTheme();
    const [open, setOpen] = useState(false);

    const swatchCss = useMemo(
        () =>
            themes
                .map((theme) => `.orgcentral-theme-swatch[data-theme-id="${theme.id}"]{background-color:${theme.color};}`)
                .join('\n'),
        [themes]
    );

    const modeOptions = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'system', label: 'System', icon: Monitor },
    ] as const;

    const handleRadioKeyDown = <T extends string>(
        event: React.KeyboardEvent<HTMLButtonElement>,
        items: readonly { id: T }[],
        currentId: T,
        onSelect: (id: T) => void
    ) => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            return;
        }

        event.preventDefault();
        const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const currentIndex = items.findIndex((item) => item.id === currentId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + direction + items.length) % items.length;
        onSelect(items[nextIndex].id);
    };

    const selectedThemeLabel = currentTheme ? themes.find((t) => t.id === currentTheme)?.name ?? 'Org default' : 'Org default';
    const selectedStyleLabel = styles.find((s) => s.id === currentStyle)?.name ?? 'Default style';
    const currentMode = mode ?? 'system';
    const resolvedModeLabel = resolvedTheme === 'dark' ? 'Dark' : resolvedTheme === 'light' ? 'Light' : null;
    const selectedModeLabel = currentMode === 'system'
        ? resolvedModeLabel
            ? `System (${resolvedModeLabel})`
            : 'System'
        : modeOptions.find((m) => m.id === currentMode)?.label ?? 'System';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <style dangerouslySetInnerHTML={{ __html: swatchCss }} />
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    aria-label="Open theme and style switcher"
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg',
                        'bg-linear-to-r from-primary/10 to-accent/10',
                        'border-primary/20',
                        'hover:from-primary/20 hover:to-accent/20',
                        'transition-all duration-300',
                        'text-sm font-medium'
                    )}
                >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Theme</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0 overflow-hidden border-border bg-background/95 backdrop-blur-xl"
                align="start"
                sideOffset={10}
            >
                <Tabs defaultValue="mode" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                        <TabsTrigger
                            value="mode"
                            className="flex-1 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Moon className="mr-2 h-4 w-4" />
                            Mode
                        </TabsTrigger>
                        <TabsTrigger
                            value="colors"
                            className="flex-1 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Palette className="mr-2 h-4 w-4" />
                            Colors
                        </TabsTrigger>
                        <TabsTrigger
                            value="styles"
                            className="flex-1 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            UI Style
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="mode" className="m-0 p-0">
                        <div className="p-3 space-y-2" role="radiogroup" aria-label="Select display mode">
                            {modeOptions.map(({ id, label, icon: Icon }) => (
                                currentMode === id ? (
                                    <button
                                        key={id}
                                        type="button"
                                        role="radio"
                                        aria-checked="true"
                                        onClick={() => {
                                            setMode(id);
                                            setOpen(false);
                                        }}
                                        onKeyDown={(event) => handleRadioKeyDown(event, modeOptions, currentMode, setMode)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all',
                                            'border-primary bg-primary/5 text-primary',
                                            FOCUS_RING_CLASSES
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
                                            setMode(id);
                                            setOpen(false);
                                        }}
                                        onKeyDown={(event) => handleRadioKeyDown(event, modeOptions, currentMode, setMode)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all',
                                            'border-transparent hover:bg-muted/50',
                                            FOCUS_RING_CLASSES
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{label}</span>
                                    </button>
                                )
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="colors" className="m-0 p-0">
                        <div className="p-2 max-h-72 overflow-y-auto" role="radiogroup" aria-label="Select color theme">
                            <div className="grid grid-cols-2 gap-2">
                                {themes.map((theme) => {
                                    const activeThemeId = currentTheme ?? theme.id;
                                    const isSelected = currentTheme === theme.id;

                                    return isSelected ? (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            role="radio"
                                            aria-checked="true"
                                            onClick={() => {
                                                setColorTheme(theme.id);
                                                setOpen(false);
                                            }}
                                            onKeyDown={(event) =>
                                                handleRadioKeyDown(event, themes, activeThemeId, setColorTheme)
                                            }
                                            className={cn(
                                                'group relative w-full rounded-lg border p-3 text-left transition-all duration-200',
                                                'hover:scale-[1.02]',
                                                'border-primary bg-primary/5',
                                                FOCUS_RING_CLASSES
                                            )}
                                        >
                                            <div
                                                className="orgcentral-theme-swatch mb-2 h-10 w-full rounded-md"
                                                data-theme-id={theme.id}
                                            />
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
                                                setColorTheme(theme.id);
                                                setOpen(false);
                                            }}
                                            onKeyDown={(event) =>
                                                handleRadioKeyDown(event, themes, activeThemeId, setColorTheme)
                                            }
                                            className={cn(
                                                'group relative w-full rounded-lg border p-3 text-left transition-all duration-200',
                                                'hover:scale-[1.02]',
                                                'border-border hover:border-primary/50',
                                                FOCUS_RING_CLASSES
                                            )}
                                        >
                                            <div
                                                className="orgcentral-theme-swatch mb-2 h-10 w-full rounded-md"
                                                data-theme-id={theme.id}
                                            />
                                            <div className="flex items-center justify-between">
                                                <span className="truncate text-xs font-medium">{theme.name}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="styles" className="m-0 p-0">
                        <div className="p-2 max-h-72 space-y-1 overflow-y-auto" role="radiogroup" aria-label="Select UI style">
                            {styles.map((style) => (
                                currentStyle === style.id ? (
                                    <button
                                        key={style.id}
                                        type="button"
                                        role="radio"
                                        aria-checked="true"
                                        onClick={() => {
                                            setStyle(style.id);
                                            setOpen(false);
                                        }}
                                        onKeyDown={(event) =>
                                            handleRadioKeyDown(event, styles, currentStyle, setStyle)
                                        }
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                                            'border-primary bg-primary/5',
                                            FOCUS_RING_CLASSES
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
                                            setStyle(style.id);
                                            setOpen(false);
                                        }}
                                        onKeyDown={(event) =>
                                            handleRadioKeyDown(event, styles, currentStyle, setStyle)
                                        }
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                                            'border-transparent hover:bg-muted/50',
                                            FOCUS_RING_CLASSES
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
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 p-3">
                    <span className="max-w-[190px] truncate text-xs text-muted-foreground">
                        {selectedModeLabel} / {selectedThemeLabel} / {selectedStyleLabel}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            clearTheme();
                            clearStyle();
                            setMode('system');
                            setOpen(false);
                        }}
                        className={cn(
                            'flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground',
                            FOCUS_RING_CLASSES,
                        )}
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
