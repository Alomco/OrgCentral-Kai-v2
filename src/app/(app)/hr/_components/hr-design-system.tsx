/**
 * 🎨 HR Design System - Futuristic UI components with "interface locking"
 * 
 * These components enforce consistent styling across all HR pages.
 * They automatically use tenant theme colors via CSS variables.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// 🌟 Glass Card - Primary content container with glassmorphism
// ============================================================================

export interface HrGlassCardProps {
    children: ReactNode;
    className?: string;
    /** Optional glow effect on hover */
    glow?: boolean;
    /** Interactive hover animation */
    interactive?: boolean;
    /** Gradient border animation */
    animated?: boolean;
}

export function HrGlassCard({
    children,
    className,
    glow = false,
    interactive = true,
    animated = false,
}: HrGlassCardProps) {
    const baseStyles = cn(
        'relative rounded-xl overflow-hidden',
        'transition-all duration-300 ease-out',
    );

    const glowStyles = glow
        ? cn(
            'after:absolute after:inset-2 after:-z-10',
            'after:bg-gradient-to-r after:from-[hsl(var(--primary)/0.18)] after:to-[hsl(var(--accent)/0.18)]',
            'after:blur-lg after:opacity-0 hover:after:opacity-100',
            'after:transition-opacity after:duration-500',
        )
        : '';

    return (
        <div className={cn(animated && 'glass-card-wrapper')}>
            <div
                className={cn(baseStyles, glowStyles, className)}
                data-ui-surface="container"
                data-ui-interactive={interactive ? 'true' : undefined}
            >
                {children}
            </div>
        </div>
    );
}

// ============================================================================
// 🌈 Gradient Header - Page/section headers with themed gradient
// ============================================================================

export interface HrGradientHeaderProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

export function HrGradientHeader({
    title,
    description,
    icon,
    actions,
    size = 'md',
}: HrGradientHeaderProps) {
    const sizeStyles = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl',
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
                {icon ? (
                    <div className={cn(
                        'flex items-center justify-center rounded-xl p-2.5',
                        'bg-linear-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]',
                        'text-white shadow-lg shadow-[hsl(var(--primary)/0.3)]',
                    )}>
                        {icon}
                    </div>
                ) : null}
                <div>
                    <h1 className={cn(
                        sizeStyles[size],
                        'font-bold tracking-tight',
                        'bg-linear-to-r from-[hsl(var(--foreground))] via-[hsl(var(--primary))] to-[hsl(var(--accent))]',
                        'bg-clip-text text-transparent',
                        'bg-size-[200%_auto] animate-[gradient-shift_3s_ease_infinite]',
                    )}>
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
        </div>
    );
}

// ============================================================================
// ✨ Status Indicator - Colorful status with glow effect
// ============================================================================

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';

const statusColors: Record<StatusVariant, { bg: string; text: string; glow: string }> = {
    success: {
        bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        glow: 'shadow-emerald-500/30',
    },
    warning: {
        bg: 'bg-amber-500/15 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        glow: 'shadow-amber-500/30',
    },
    error: {
        bg: 'bg-rose-500/15 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        glow: 'shadow-rose-500/30',
    },
    info: {
        bg: 'bg-[hsl(var(--primary)/0.15)]',
        text: 'text-[hsl(var(--primary))]',
        glow: 'shadow-[hsl(var(--primary)/0.3)]',
    },
    pending: {
        bg: 'bg-violet-500/15 dark:bg-violet-500/20',
        text: 'text-violet-700 dark:text-violet-400',
        glow: 'shadow-violet-500/30',
    },
    neutral: {
        bg: 'bg-slate-500/15 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-400',
        glow: 'shadow-slate-500/30',
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

// ============================================================================
// 🔘 Gradient Button - Primary action button with theme gradient
// ============================================================================

export interface HrGradientButtonProps {
    children: ReactNode;
    type?: 'button' | 'submit';
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function HrGradientButton({
    children,
    type = 'button',
    disabled = false,
    onClick,
    className,
    size = 'md',
}: HrGradientButtonProps) {
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'relative overflow-hidden rounded-lg font-semibold text-white',
                'bg-linear-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.9)] to-[hsl(var(--accent))]',
                'shadow-lg shadow-[hsl(var(--primary)/0.3)]',
                'transition-all duration-300 ease-out',
                'hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.4)]',
                'hover:-translate-y-0.5',
                'active:translate-y-0 active:shadow-md',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
                sizeStyles[size],
                className,
            )}
        >
            {/* Shimmer effect */}
            <span className={cn(
                'absolute inset-0 -translate-x-full',
                'bg-linear-to-r from-transparent via-white/20 to-transparent',
                'group-hover:animate-[shimmer_1.5s_infinite]',
            )} />
            {children}
        </button>
    );
}

// ============================================================================
// 📊 Stat Card - Metric display with gradient accent
// ============================================================================

export interface HrStatCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    trend?: { value: number; label: string };
    accentColor?: 'primary' | 'accent' | 'success' | 'warning';
}

const accentStyles = {
    primary: {
        icon: 'from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.7)]',
        bar: 'bg-linear-to-b from-[hsl(var(--primary))] to-[hsl(var(--accent)/0.6)] shadow-[0_0_12px_hsl(var(--primary)/0.35)]',
    },
    accent: {
        icon: 'from-[hsl(var(--accent))] to-[hsl(var(--accent)/0.7)]',
        bar: 'bg-linear-to-b from-[hsl(var(--accent))] to-[hsl(var(--primary)/0.6)] shadow-[0_0_12px_hsl(var(--accent)/0.35)]',
    },
    success: {
        icon: 'from-emerald-500 to-emerald-400',
        bar: 'bg-linear-to-b from-emerald-500 to-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    },
    warning: {
        icon: 'from-amber-500 to-amber-400',
        bar: 'bg-linear-to-b from-amber-500 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    },
};

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
                className={cn(
                    'absolute inset-y-4 left-3 w-1 rounded-full',
                    accent.bar,
                )}
            />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
                    {trend ? (
                        <p className={cn(
                            'mt-1 text-xs font-medium',
                            trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        )}>
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    ) : null}
                </div>
                {icon ? (
                    <div className={cn(
                        'flex items-center justify-center rounded-lg p-2',
                        'bg-linear-to-br text-white',
                        accent.icon,
                    )}>
                        {icon}
                    </div>
                ) : null}
            </div>
        </HrGlassCard>
    );
}

// ============================================================================
// 📋 Section Container - Organized section with header
// ============================================================================

export interface HrSectionProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    actions?: ReactNode;
}

export function HrSection({ title, description, icon, children, actions }: HrSectionProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon ? (
                        <span className="text-[hsl(var(--primary))]">{icon}</span>
                    ) : null}
                    <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        {description ? (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        ) : null}
                    </div>
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}
