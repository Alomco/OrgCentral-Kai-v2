/**
 * 🎯 Theme-Aware Interactive Components
 * 
 * Button and interactive element variants with theme adaptation.
 * Following SOLID (SRP, OCP, LSP) with <250 LOC.
 * 
 * @module components/theme/primitives
 */

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Futuristic Button Component (SRP - Single Responsibility)
// ============================================================================

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-300 ease-out outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg',
                destructive: 'bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90',
                outline: 'bg-transparent shadow-[0_0_0_1px_oklch(var(--border)/0.4)] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_0_1px_oklch(var(--primary)/0.35),0_12px_24px_-20px_oklch(var(--primary)/0.25)]',
                secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                gradient: 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl',
                glass: 'bg-card/50 backdrop-blur-md shadow-[0_0_0_1px_oklch(var(--border)/0.25)] hover:bg-card/70 hover:shadow-[0_0_0_1px_oklch(var(--border)/0.4),0_10px_20px_-16px_oklch(var(--foreground)/0.25)]',
                neon: 'bg-primary/20 text-primary shadow-[0_0_0_1px_oklch(var(--primary)/0.4),0_12px_28px_-20px_oklch(var(--primary)/0.35)] hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_0_1px_oklch(var(--primary)/0.55),0_18px_36px_-24px_oklch(var(--primary)/0.45)]',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-10 px-4 text-sm',
                lg: 'h-11 px-6 text-base',
                xl: 'h-12 px-8 text-lg',
                icon: 'h-10 w-10',
                'icon-sm': 'h-8 w-8',
                'icon-lg': 'h-12 w-12',
            },
            animation: {
                none: '',
                pulse: 'hover:animate-pulse-glow',
                shimmer: 'relative overflow-hidden before:absolute before:inset-0 before:bg-white/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
            animation: 'none',
        },
    }
);

export interface ThemeButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const ThemeButton = forwardRef<HTMLButtonElement, ThemeButtonProps>(
    ({ className, variant, size, animation, ...props }, ref) => {
        return (
            <button
                data-slot="button"
                className={cn(buttonVariants({ variant, size, animation }), className)}
                ref={ref}
                {...props}
            />
        );
    }
);

ThemeButton.displayName = 'ThemeButton';

// ============================================================================
// Icon Button (LSP - Liskov Substitution)
// ============================================================================

export interface ThemeIconButtonProps extends Omit<ThemeButtonProps, 'size'> {
    size?: 'sm' | 'md' | 'lg';
    'aria-label': string;
}

export const ThemeIconButton = forwardRef<HTMLButtonElement, ThemeIconButtonProps>(
    ({ className, size = 'md', ...props }, ref) => {
        const iconSize = size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon';

        return (
            <ThemeButton
                className={cn('rounded-full', className)}
                size={iconSize}
                ref={ref}
                {...props}
            />
        );
    }
);

ThemeIconButton.displayName = 'ThemeIconButton';

// ============================================================================
// Badge Component (OCP - Open/Closed)
// ============================================================================

const badgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 ease-out',
    {
        variants: {
            variant: {
                default: 'bg-primary/10 text-primary shadow-[0_0_0_1px_oklch(var(--primary)/0.2)]',
                secondary: 'bg-secondary text-secondary-foreground',
                destructive: 'bg-destructive/10 text-destructive shadow-[0_0_0_1px_oklch(var(--destructive)/0.2)]',
                outline: 'bg-transparent shadow-[0_0_0_1px_oklch(var(--border)/0.4)]',
                success: 'bg-accent/15 text-foreground shadow-[0_0_0_1px_oklch(var(--accent)/0.2)]',
                warning: 'bg-secondary/70 text-secondary-foreground shadow-[0_0_0_1px_oklch(var(--secondary)/0.25)]',
                info: 'bg-primary/10 text-primary shadow-[0_0_0_1px_oklch(var(--primary)/0.2)]',
                gradient: 'bg-primary/80 text-primary-foreground',
                glow: 'bg-primary/20 text-primary shadow-[0_0_0_1px_oklch(var(--primary)/0.35),0_10px_20px_-16px_oklch(var(--primary)/0.3)]',
            },
            size: {
                sm: 'text-[10px] px-2 py-0.5',
                md: 'text-xs px-2.5 py-0.5',
                lg: 'text-sm px-3 py-1',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

export interface ThemeBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

export function ThemeBadge({ className, variant, size, ...props }: ThemeBadgeProps) {
    return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
