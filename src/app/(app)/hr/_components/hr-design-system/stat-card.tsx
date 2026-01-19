import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { HrGlassCard } from './glass-card';

export interface HrStatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    trend?: { value: number; label: string };
    accentColor?: 'primary' | 'accent' | 'success' | 'warning';
}

const accentStyles = {
    primary: {
        icon: 'bg-primary text-primary-foreground',
        bar: 'bg-primary/60 shadow-[0_0_12px_oklch(var(--primary)/0.25)]',
    },
    accent: {
        icon: 'bg-accent text-accent-foreground',
        bar: 'bg-accent/60 shadow-[0_0_12px_oklch(var(--accent)/0.25)]',
    },
    success: {
        icon: 'bg-accent text-accent-foreground',
        bar: 'bg-accent/60 shadow-[0_0_12px_oklch(var(--accent)/0.25)]',
    },
    warning: {
        icon: 'bg-secondary text-secondary-foreground',
        bar: 'bg-secondary/60 shadow-[0_0_12px_oklch(var(--secondary)/0.25)]',
    },
} as const;

export function HrStatCard({
    label,
    value,
    icon,
    trend,
    accentColor = 'primary',
}: HrStatCardProps) {
    const accent = accentStyles[accentColor];

    return (
        <HrGlassCard className={cn('relative p-5 pl-8')}>
            <span
                aria-hidden="true"
                className={cn('absolute inset-y-4 left-3 w-1 rounded-full', accent.bar)}
            />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
                    {trend ? (
                        <p className={cn(
                            'mt-1 text-xs font-medium',
                            trend.value >= 0 ? 'text-primary' : 'text-destructive',
                        )}>
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    ) : null}
                </div>
                {icon ? (
                    <div
                        className={cn(
                            'flex items-center justify-center rounded-lg p-2',
                            'text-white',
                            accent.icon,
                        )}
                    >
                        {icon}
                    </div>
                ) : null}
            </div>
        </HrGlassCard>
    );
}
