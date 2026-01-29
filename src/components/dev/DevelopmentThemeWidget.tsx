'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Paintbrush } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDevelopmentThemeStore } from './development-theme-store';
import { useRegisterDevelopmentAction } from './toolbar';

export interface DevelopmentThemeWidgetProps {
    orgId: string;
    enabled: boolean;
}

const STYLE_ELEMENT_ID = 'orgcentral-dev-theme-overrides';

const DEMO_OVERRIDES: Record<string, string> = {
    primary: '257 74% 64%',
    'primary-foreground': '260 100% 98%',
    'sidebar-background': '258 54% 18%',
    'sidebar-foreground': '260 40% 96%',
};

function buildCss(overrides: Record<string, string> | null): string {
    if (!overrides) {
        return '';
    }

    const declarations = Object.entries(overrides)
        .map(([key, token]) => `--${key}: ${token} !important;`)
        .join(' ');

    return `:root { ${declarations} } .dark { ${declarations} }`;
}

function applyOverrides(overrides: Record<string, string> | null): void {
    const css = buildCss(overrides);
    const existing = document.getElementById(STYLE_ELEMENT_ID);

    if (!css) {
        if (existing) {
            existing.remove();
        }
        return;
    }

    const style = existing ?? document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    style.textContent = css;

    if (!existing) {
        document.head.appendChild(style);
    }
}

export function DevelopmentThemeWidget({ orgId, enabled }: DevelopmentThemeWidgetProps) {
    const [open, setOpen] = useState(false);
    const isDevelopment = process.env.NODE_ENV === 'development';
    const visible = enabled && isDevelopment;
    const preset = useDevelopmentThemeStore((state) => state.preset);
    const setPreset = useDevelopmentThemeStore((state) => state.setPreset);

    useEffect(() => {
        if (!visible) {
            applyOverrides(null);
            return;
        }

        if (preset === 'demo') {
            applyOverrides(DEMO_OVERRIDES);
        } else {
            applyOverrides(null);
        }
    }, [preset, visible]);

    const badge = useMemo(() => {
        return preset === 'demo' ? <Badge variant="secondary">demo</Badge> : <Badge variant="outline">server</Badge>;
    }, [preset]);

    const shortOrgId = useMemo(() => {
        return orgId.length > 12 ? `${orgId.slice(0, 8)}...${orgId.slice(-4)}` : orgId;
    }, [orgId]);

    const handleReset = useCallback(() => {
        setPreset('server');
    }, [setPreset]);

    const component = (
        <div className="fixed bottom-4 right-20 z-(--z-dev-widget) animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-card text-foreground shadow-xl backdrop-blur">
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold">Dev theme</div>
                            {badge}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">org {shortOrgId}</div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setOpen(false)}
                        aria-label="Close dev theme widget"
                    >
                        x
                    </Button>
                </div>
                <Separator />
                <div className="space-y-3 px-4 py-3 text-sm">
                    <label className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Theme preset</div>
                        <select
                            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                            value={preset}
                            onChange={(event) => {
                                const next = event.target.value === 'demo' ? 'demo' : 'server';
                                setPreset(next);
                            }}
                        >
                            <option value="server">Server (tenant)</option>
                            <option value="demo">Demo override</option>
                        </select>
                    </label>

                    <div className="flex items-center justify-between gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
                            Reset
                        </Button>
                        <div className="text-xs text-muted-foreground">Dev super admin only</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const action = visible ? {
        id: 'dev-theme',
        label: 'Dev Theme',
        icon: <Paintbrush className="h-4 w-4" />,
        onClick: () => setOpen((current) => !current),
        isActive: open,
        order: 20,
        component,
    } : null;

    useRegisterDevelopmentAction(action);

    if (!visible) {
        return null;
    }

    return null; // Rendered by DevToolbar
}
