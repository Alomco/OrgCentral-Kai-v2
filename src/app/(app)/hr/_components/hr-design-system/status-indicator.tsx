import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';

const statusColors: Record<StatusVariant, { bg: string; text: string; glow: string }> = {
    success: {
        bg: 'bg-accent/15',
        text: 'text-foreground',
        glow: 'shadow-[0_0_12px_oklch(var(--accent)/0.25)]',
    },
    warning: {
        bg: 'bg-secondary/70',
        text: 'text-secondary-foreground',
        glow: 'shadow-[0_0_12px_oklch(var(--secondary)/0.25)]',
    },
    error: {
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        glow: 'shadow-[0_0_12px_oklch(var(--destructive)/0.25)]',
    },
    info: {
        bg: 'bg-primary/10',
        text: 'text-primary',
        glow: 'shadow-[0_0_12px_oklch(var(--primary)/0.25)]',
    },
    pending: {
        bg: 'bg-muted/60',
        text: 'text-muted-foreground',
        glow: 'shadow-[0_0_12px_oklch(var(--muted-foreground)/0.25)]',
    },
    neutral: {
        bg: 'bg-muted/40',
        text: 'text-muted-foreground',
        glow: 'shadow-[0_0_12px_oklch(var(--muted-foreground)/0.2)]',
    },
};

export interface HrStatusIndicatorProps {
    status: StatusVariant;
    label: string;
    icon?: ReactNode;
    glow?: boolean;
}

export function HrStatusIndicator({ status, label, icon, glow = false }: HrStatusIndicatorProps) {
    const colors = statusColors[status];

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
            colors.bg,
            colors.text,
            glow && `shadow-lg ${colors.glow}`,
            'transition-all duration-200',
        )}>
            {icon}
            {label}
        </span>
    );
}
