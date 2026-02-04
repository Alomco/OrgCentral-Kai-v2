'use client';

import { useMemo, useState } from 'react';
import { Monitor, Moon, Palette, RotateCcw, Sparkles, Sun } from 'lucide-react';
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
import { buildSwatchCss, FOCUS_RING_CLASSES } from './theme-switcher.utils';
import type { ThemeOption } from './theme-switcher.utils';
import { ColorPanel, ModePanel, StylePanel } from './theme-switcher.panels';
import type { ModeOption } from './theme-switcher.panels';

const MODE_OPTIONS: ModeOption[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
];

export function ThemeSwitcher() {
    const { currentTheme, setTheme: setColorTheme, clearTheme, themes } = useColorTheme();
    const { currentStyle, setStyle, clearStyle, styles } = useUiStyle();
    const { theme: mode, resolvedTheme, setTheme: setMode } = useNextTheme();
    const [open, setOpen] = useState(false);

    const swatchCss = useMemo(() => buildSwatchCss(themes as readonly ThemeOption[]), [themes]);

    const selectedThemeLabel = currentTheme
        ? themes.find((t) => t.id === currentTheme)?.name ?? 'Org default'
        : 'Org default';
    const selectedStyleLabel = styles.find((s) => s.id === currentStyle)?.name ?? 'Default style';
    const currentMode: ModeOption['id'] = mode === 'light' || mode === 'dark' ? mode : 'system';
    const resolvedModeLabel = resolvedTheme === 'dark' ? 'Dark' : resolvedTheme === 'light' ? 'Light' : null;
    const selectedModeLabel = currentMode === 'system'
        ? resolvedModeLabel
            ? `System (${resolvedModeLabel})`
            : 'System'
        : MODE_OPTIONS.find((m) => m.id === currentMode)?.label ?? 'System';
    type ThemeId = Parameters<typeof setColorTheme>[0];
    const currentThemeId: ThemeId | null = currentTheme ?? null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <style dangerouslySetInnerHTML={{ __html: swatchCss }} />
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    aria-label="Open theme and style switcher"
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg',
                        'bg-muted/50',
                        'border-border/60',
                        'hover:bg-muted/70',
                        'transition-all duration-300',
                        'text-sm font-medium'
                    )}
                >
                    <Palette className="h-4 w-4" />
                    <span className="hidden sm:inline">Theme</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 overflow-hidden rounded-xl border border-[oklch(var(--border)/0.6)] bg-popover p-0 text-popover-foreground shadow-[var(--ui-surface-item-shadow)]"
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
                        <ModePanel
                            modeOptions={MODE_OPTIONS}
                            currentMode={currentMode}
                            onSelect={setMode}
                            setOpen={setOpen}
                        />
                    </TabsContent>

                    <TabsContent value="colors" className="m-0 p-0">
                        <ColorPanel<ThemeId>
                            themes={themes as readonly ThemeOption[]}
                            currentTheme={currentThemeId}
                            onSelect={setColorTheme}
                            setOpen={setOpen}
                        />
                    </TabsContent>

                    <TabsContent value="styles" className="m-0 p-0">
                        <StylePanel
                            styles={styles}
                            currentStyle={currentStyle}
                            onSelect={setStyle}
                            setOpen={setOpen}
                        />
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between gap-2 border-t border-border bg-[oklch(var(--muted)/0.4)] p-3">
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
