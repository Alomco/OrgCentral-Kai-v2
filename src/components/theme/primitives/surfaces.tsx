/**
 * 🎨 Theme-Aware Component Primitives
 * 
 * Generic, reusable components that adapt to tenant themes.
 * Following SOLID principles with <250 LOC per file.
 * 
 * @module components/theme/primitives
 */

import { type ReactNode, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Container Components (ISP - Interface Segregation)
// ============================================================================

const containerVariants = cva(
    'w-full transition-all duration-300 ease-out',
    {
        variants: {
            spacing: {
                none: '',
                sm: 'p-4',
                md: 'p-6',
                lg: 'p-8',
                xl: 'p-10',
            },
            maxWidth: {
                full: 'max-w-full',
                screen: 'max-w-screen-2xl mx-auto',
                prose: 'max-w-prose mx-auto',
                sm: 'max-w-sm mx-auto',
                md: 'max-w-md mx-auto',
                lg: 'max-w-lg mx-auto',
                xl: 'max-w-xl mx-auto',
                '2xl': 'max-w-2xl mx-auto',
                '4xl': 'max-w-4xl mx-auto',
                '6xl': 'max-w-6xl mx-auto',
            },
            background: {
                none: '',
                default: 'bg-background',
                card: 'bg-card',
                muted: 'bg-muted',
                primary: 'bg-primary',
                secondary: 'bg-secondary',
                accent: 'bg-accent',
            },
        },
        defaultVariants: {
            spacing: 'md',
            maxWidth: 'full',
            background: 'none',
        },
    }
);

export interface ContainerProps extends VariantProps<typeof containerVariants> {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}

export function Container({
    children,
    className,
    spacing,
    maxWidth,
    background,
    as: Component = 'div',
}: ContainerProps) {
    const Comp = Component;
    return (
        <Comp className={cn(containerVariants({ spacing, maxWidth, background }), className)}>
            {children}
        </Comp>
    );
}

// ============================================================================
// Glass/Frosted Surface (OCP - Open/Closed)
// ============================================================================

const glassSurfaceVariants = cva(
    'backdrop-blur-md border transition-all duration-300 ease-out',
    {
        variants: {
            intensity: {
                subtle: 'bg-card/30 backdrop-blur-sm',
                medium: 'bg-card/50 backdrop-blur-md',
                strong: 'bg-card/70 backdrop-blur-lg',
                solid: 'bg-card/95 backdrop-blur-xl',
            },
            border: {
                none: 'border-transparent',
                subtle: 'border-border/20',
                medium: 'border-border/40',
                strong: 'border-border/60',
                accent: 'border-accent/30',
            },
            rounded: {
                none: '',
                sm: 'rounded-sm',
                md: 'rounded-md',
                lg: 'rounded-lg',
                xl: 'rounded-xl',
                '2xl': 'rounded-2xl',
                full: 'rounded-full',
            },
            shadow: {
                none: '',
                sm: 'shadow-sm',
                md: 'shadow-md',
                lg: 'shadow-lg',
                xl: 'shadow-xl',
                glow: 'shadow-lg shadow-primary/20',
            },
        },
        defaultVariants: {
            intensity: 'medium',
            border: 'subtle',
            rounded: 'lg',
            shadow: 'md',
        },
    }
);

export interface GlassSurfaceProps extends VariantProps<typeof glassSurfaceVariants> {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}

export function GlassSurface({
    children,
    className,
    intensity,
    border,
    rounded,
    shadow,
    as: Component = 'div',
}: GlassSurfaceProps) {
    const Comp = Component;
    return (
        <Comp
            className={cn(glassSurfaceVariants({ intensity, border, rounded, shadow }), className)}
        >
            {children}
        </Comp>
    );
}

// ============================================================================
// Gradient Accent (DIP - Dependency Inversion)
// ============================================================================

const gradientAccentVariants = cva(
    'relative overflow-hidden transition-all duration-500 ease-out',
    {
        variants: {
            variant: {
                primary: 'bg-gradient-to-br from-primary/90 via-primary to-primary/80',
                accent: 'bg-gradient-to-br from-accent/90 via-accent to-accent/80',
                vibrant: 'bg-gradient-to-br from-primary via-accent to-secondary',
                sunset: 'bg-gradient-to-br from-primary via-accent to-destructive',
                ocean: 'bg-gradient-to-br from-primary/80 via-accent/70 to-primary/60',
                aurora: 'bg-gradient-to-br from-primary via-accent via-secondary to-primary',
            },
            animated: {
                true: 'animate-pulse-glow',
                false: '',
            },
            rounded: {
                none: '',
                sm: 'rounded-sm',
                md: 'rounded-md',
                lg: 'rounded-lg',
                xl: 'rounded-xl',
                '2xl': 'rounded-2xl',
                full: 'rounded-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            animated: false,
            rounded: 'lg',
        },
    }
);

export interface GradientAccentProps extends VariantProps<typeof gradientAccentVariants> {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}

export function GradientAccent({
    children,
    className,
    variant,
    animated,
    rounded,
    as: Component = 'div',
}: GradientAccentProps) {
    const Comp = Component;
    return (
        <Comp className={cn(gradientAccentVariants({ variant, animated, rounded }), className)}>
            {children}
        </Comp>
    );
}
