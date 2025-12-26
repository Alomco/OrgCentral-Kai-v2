/**
 * 🎴 Theme-Aware Card Components
 * 
 * Professional card designs that adapt to tenant themes.
 * Following SOLID with PPR/Suspense support <250 LOC.
 * 
 * @module components/theme/cards
 */

import { type ReactNode, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Base Card Component (SRP)
// ============================================================================

const cardVariants = cva(
    'rounded-xl transition-all duration-300 ease-out',
    {
        variants: {
            variant: {
                default: 'bg-card text-card-foreground border border-border shadow-sm',
                elevated: 'bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl',
                glass: 'bg-card/50 backdrop-blur-md border border-border/30 shadow-md',
                outline: 'bg-transparent border-2 border-border hover:border-primary/50',
                gradient: 'bg-gradient-to-br from-card via-card/95 to-card/90 border border-border/50 shadow-lg',
                glow: 'bg-card border border-primary/20 shadow-lg shadow-primary/10',
                neon: 'bg-card/90 border-2 border-primary/30 shadow-xl shadow-primary/20',
            },
            padding: {
                none: '',
                sm: 'p-4',
                md: 'p-6',
                lg: 'p-8',
                xl: 'p-10',
            },
            hover: {
                none: '',
                lift: 'hover:-translate-y-1 hover:shadow-xl',
                glow: 'hover:shadow-xl hover:shadow-primary/20 hover:border-primary/30',
                scale: 'hover:scale-[1.02]',
            },
        },
        defaultVariants: {
            variant: 'default',
            padding: 'md',
            hover: 'none',
        },
    }
);

export interface ThemeCardProps extends VariantProps<typeof cardVariants> {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}

export function ThemeCard({
    children,
    className,
    variant,
    padding,
    hover,
    as: Component = 'div',
}: ThemeCardProps) {
    const Comp = Component;
    return (
        <Comp className={cn(cardVariants({ variant, padding, hover }), className)}>
            {children}
        </Comp>
    );
}

// ============================================================================
// Card Header (ISP - Interface Segregation)
// ============================================================================

export interface ThemeCardHeaderProps {
    children: ReactNode;
    className?: string;
    accent?: boolean;
}

export function ThemeCardHeader({ children, className, accent }: ThemeCardHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-1.5 border-b border-border/50 pb-4 mb-4',
                accent && 'border-l-4 border-l-primary pl-4',
                className
            )}
        >
            {children}
        </div>
    );
}

// ============================================================================
// Card Title (Typography)
// ============================================================================

const cardTitleVariants = cva(
    'font-semibold leading-none tracking-tight',
    {
        variants: {
            size: {
                sm: 'text-base',
                md: 'text-lg',
                lg: 'text-xl',
                xl: 'text-2xl',
            },
            gradient: {
                true: 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
                false: 'text-foreground',
            },
        },
        defaultVariants: {
            size: 'lg',
            gradient: false,
        },
    }
);

export interface ThemeCardTitleProps extends VariantProps<typeof cardTitleVariants> {
    children: ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function ThemeCardTitle({
    children,
    className,
    size,
    gradient,
    as: Component = 'h3',
}: ThemeCardTitleProps) {
    return (
        <Component className={cn(cardTitleVariants({ size, gradient }), className)}>
            {children}
        </Component>
    );
}

// ============================================================================
// Card Description
// ============================================================================

export interface ThemeCardDescriptionProps {
    children: ReactNode;
    className?: string;
}

export function ThemeCardDescription({ children, className }: ThemeCardDescriptionProps) {
    return (
        <p className={cn('text-sm text-muted-foreground leading-relaxed', className)}>
            {children}
        </p>
    );
}

// ============================================================================
// Card Content
// ============================================================================

export interface ThemeCardContentProps {
    children: ReactNode;
    className?: string;
}

export function ThemeCardContent({ children, className }: ThemeCardContentProps) {
    return <div className={cn('space-y-4', className)}>{children}</div>;
}

// ============================================================================
// Card Footer
// ============================================================================

export interface ThemeCardFooterProps {
    children: ReactNode;
    className?: string;
    divided?: boolean;
}

export function ThemeCardFooter({ children, className, divided }: ThemeCardFooterProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 mt-4',
                divided && 'border-t border-border/50 pt-4',
                className
            )}
        >
            {children}
        </div>
    );
}
