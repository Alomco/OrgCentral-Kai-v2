'use client';

import { useActionState } from 'react';
import { Check, Palette, RotateCcw, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getPresetOptions } from '@/server/theme/theme-presets';

import { resetOrgThemeAction, updateOrgThemeAction, updateOrgThemeColorsAction } from '../actions';
import { initialThemeState } from '../actions.state';

interface OrgThemeManagerProps {
    orgId: string;
    currentPresetId?: string;
}

export function OrgThemeManager({ orgId, currentPresetId }: OrgThemeManagerProps) {
    const presets = getPresetOptions();

    const boundPresetAction = updateOrgThemeAction.bind(null, orgId);
    const boundColorsAction = updateOrgThemeColorsAction.bind(null, orgId);
    const boundResetAction = resetOrgThemeAction.bind(null, orgId);

    const [presetState, presetAction, isPresetPending] = useActionState(boundPresetAction, initialThemeState);
    const [colorsState, colorsAction, isColorsPending] = useActionState(boundColorsAction, initialThemeState);
    const [resetState, resetAction, isResetPending] = useActionState(boundResetAction, initialThemeState);

    return (
        <div className="space-y-6">
            {/* 🎨 Theme Preset Selector */}
            <Card className="overflow-hidden border-0 bg-background/80 shadow-xl backdrop-blur-xl">
                <CardHeader className="border-b border-[hsl(var(--primary)/0.1)] bg-linear-to-r from-[hsl(var(--primary)/0.05)] to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-lg">
                            <Palette className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Theme Presets</CardTitle>
                            <CardDescription>Choose a color scheme for this organization</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <form action={presetAction}>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {presets.map((preset) => (
                                <label
                                    key={preset.id}
                                    className={cn(
                                        'group relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200',
                                        'hover:border-[hsl(var(--primary)/0.5)] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.1)]',
                                        currentPresetId === preset.id
                                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] shadow-md'
                                            : 'border-[hsl(var(--border))] bg-card/50',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="presetId"
                                        value={preset.id}
                                        defaultChecked={currentPresetId === preset.id}
                                        className="sr-only"
                                    />
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{preset.emoji}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold">{preset.name}</p>
                                            <p className="text-xs text-muted-foreground">{preset.description}</p>
                                        </div>
                                        {currentPresetId === preset.id && (
                                            <Check className="h-5 w-5 text-[hsl(var(--primary))]" />
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <Button
                                type="submit"
                                disabled={isPresetPending}
                                className="bg-linear-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-lg hover:shadow-xl"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Apply Theme
                            </Button>
                            {presetState.status === 'success' && (
                                <span className="text-sm text-emerald-600">{presetState.message}</span>
                            )}
                            {presetState.status === 'error' && (
                                <span className="text-sm text-rose-600">{presetState.message}</span>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* 🎯 Custom Color Overrides */}
            <Card className="overflow-hidden border-0 bg-background/80 shadow-xl backdrop-blur-xl">
                <CardHeader className="border-b border-[hsl(var(--accent)/0.1)] bg-linear-to-r from-[hsl(var(--accent)/0.05)] to-transparent">
                    <CardTitle className="text-lg">Custom Colors</CardTitle>
                    <CardDescription>Fine-tune individual colors (HSL format: &quot;262 83% 58%&quot;)</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form action={colorsAction} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor">Primary Color (HSL)</Label>
                                <Input
                                    id="primaryColor"
                                    name="primaryColor"
                                    placeholder="262 83% 58%"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accentColor">Accent Color (HSL)</Label>
                                <Input
                                    id="accentColor"
                                    name="accentColor"
                                    placeholder="330 81% 60%"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button type="submit" variant="outline" disabled={isColorsPending}>
                                Save Custom Colors
                            </Button>
                            {colorsState.status === 'success' && (
                                <span className="text-sm text-emerald-600">{colorsState.message}</span>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* 🔄 Reset Theme */}
            <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20">
                <CardContent className="flex items-center justify-between p-4">
                    <div>
                        <p className="font-medium">Reset to Default</p>
                        <p className="text-sm text-muted-foreground">Remove all theme customizations</p>
                    </div>
                    <form action={resetAction}>
                        <Button type="submit" variant="destructive" size="sm" disabled={isResetPending}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset Theme
                        </Button>
                    </form>
                    {resetState.status === 'success' && (
                        <span className="text-sm text-emerald-600">{resetState.message}</span>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
