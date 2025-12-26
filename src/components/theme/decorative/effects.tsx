/**
 * ✨ Decorative Theme Components
 * 
 * Visual effects and decorative elements for futuristic UI.
 * Motion-safe with reduced-motion support <250 LOC.
 * 
 * @module components/theme/decorative
 */

import { type ReactNode, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Shimmer Effect (Accessibility - prefers-reduced-motion)
// ============================================================================

export interface ShimmerProps extends HTMLAttributes<HTMLDivElement> {
    duration?: 'slow' | 'normal' | 'fast';
}

export function Shimmer({ className, duration = 'normal', ...props }: ShimmerProps) {
    const durationClass = {
        slow: 'duration-[3s]',
        normal: 'duration-[2s]',
        fast: 'duration-[1s]',
    }[duration];

    return (
        <div
            className={cn(
                'absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent',
                'motion-safe:animate-shimmer motion-reduce:opacity-0',
                durationClass,
                className
            )}
            {...props}
        />
    );
}

// ============================================================================
// Glow Effect (Theme-Aware)
// ============================================================================

const glowVariants = cva(
    'absolute rounded-full blur-3xl opacity-40 pointer-events-none',
    {
        variants: {
            color: {
                primary: 'bg-primary',
                accent: 'bg-accent',
                secondary: 'bg-secondary',
                success: 'bg-green-500',
                warning: 'bg-yellow-500',
                danger: 'bg-destructive',
            },
            size: {
                sm: 'h-24 w-24',
                md: 'h-40 w-40',
                lg: 'h-56 w-56',
                xl: 'h-72 w-72',
            },
            animated: {
                true: 'motion-safe:animate-pulse-glow motion-reduce:animate-none',
                false: '',
            },
        },
        defaultVariants: {
            color: 'primary',
            size: 'md',
            animated: true,
        },
    }
);

export interface GlowEffectProps extends VariantProps<typeof glowVariants> {
    className?: string;
}

export function GlowEffect({ className, color, size, animated }: GlowEffectProps) {
    return <div className={cn(glowVariants({ color, size, animated }), className)} />;
}

// ============================================================================
// Gradient Orb (Decorative Background)
// ============================================================================

export interface GradientOrbProps {
    className?: string;
    color?: 'primary' | 'accent' | 'multi';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export function GradientOrb({ className, color = 'primary', position = 'top-right' }: GradientOrbProps) {
    const positionClass = {
        'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
        'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
        'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
        'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    }[position];

    const colorClass = {
        primary: 'bg-gradient-to-br from-primary/40 via-primary/20 to-transparent',
        accent: 'bg-gradient-to-br from-accent/40 via-accent/20 to-transparent',
        multi: 'bg-gradient-to-br from-primary/30 via-accent/25 to-secondary/20',
    }[color];

    return (
        <div
            className={cn(
                'absolute h-[500px] w-[500px] rounded-full blur-3xl pointer-events-none',
                'motion-safe:animate-blob motion-reduce:animate-none',
                colorClass,
                positionClass,
                className
            )}
            aria-hidden="true"
        />
    );
}

// ============================================================================
// Divider with Accent
// ============================================================================

const dividerVariants = cva(
    'flex items-center w-full',
    {
        variants: {
            variant: {
                solid: 'border-t border-border',
                dashed: 'border-t border-dashed border-border',
                gradient: 'h-px bg-gradient-to-r from-transparent via-border to-transparent',
                glow: 'h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-lg shadow-primary/20',
            },
            spacing: {
                sm: 'my-4',
                md: 'my-6',
                lg: 'my-8',
                xl: 'my-12',
            },
        },
        defaultVariants: {
            variant: 'solid',
            spacing: 'md',
        },
    }
);

export interface ThemeDividerProps extends VariantProps<typeof dividerVariants> {
    children?: ReactNode;
    className?: string;
}

export function ThemeDivider({ children, className, variant, spacing }: ThemeDividerProps) {
    if (!children) {
        return <div className={cn(dividerVariants({ variant, spacing }), className)} />;
    }

    return (
        <div className={cn('flex items-center gap-4', spacing && `my-${spacing}`, className)}>
            <div className={cn(dividerVariants({ variant, spacing: undefined }), 'flex-1')} />
            <div className="text-sm text-muted-foreground font-medium">{children}</div>
            <div className={cn(dividerVariants({ variant, spacing: undefined }), 'flex-1')} />
        </div>
    );
}
