/**
 * 🃏 Premium Card Components
 * 
 * Feature cards, info cards, and action cards with premium styling.
 * Server Component with CVA.
 * 
 * @module components/theme/elements/cards
 */

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Feature Card
// ============================================================================

const featureCardVariants = cva(
    'group relative overflow-hidden rounded-lg p-6 transition-all',
    {
        variants: {
            variant: {
                default: '',
                glass: '[--ui-surface-fill:hsl(var(--card)/0.72)] [--ui-surface-blur:16px]',
                gradient: 'bg-gradient-to-br from-card/90 via-card/80 to-primary/8',
                outline: '[--ui-surface-fill:transparent] [--ui-surface-shadow:var(--ui-surface-outline-weak)] hover:[--ui-surface-fill:hsl(var(--card)/0.88)] hover:[--ui-surface-shadow:var(--ui-surface-item-shadow)]',
            },
            interactive: {
                true: '',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            interactive: false,
        },
    }
);

export interface FeatureCardProps extends VariantProps<typeof featureCardVariants> {
    icon?: ReactNode;
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function FeatureCard({
    icon,
    title,
    description,
    children,
    variant,
    interactive,
    className,
    onClick,
}: FeatureCardProps) {
    const isInteractive = Boolean(interactive);

    return (
        <div
            className={cn(featureCardVariants({ variant, interactive }), className)}
            onClick={onClick}
            data-slot="feature-card"
            data-ui-surface={isInteractive ? 'interactive' : 'item'}
            data-ui-interactive={isInteractive ? 'true' : undefined}
        >
            {icon && (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
                    {icon}
                </div>
            )}
            <h3 className="font-semibold text-lg">{title}</h3>
            {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}

// ============================================================================
// Info Card
// ============================================================================

export interface InfoCardProps {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error';
    className?: string;
}

export function InfoCard({ label, value, icon, variant = 'default', className }: InfoCardProps) {
    const variantStyles = {
        default: '',
        success: 'text-emerald-600 dark:text-emerald-400 [--ui-surface-fill:hsl(142_76%_35%_/_0.12)] dark:[--ui-surface-fill:hsl(142_76%_30%_/_0.2)]',
        warning: 'text-amber-600 dark:text-amber-400 [--ui-surface-fill:hsl(45_93%_47%_/_0.12)] dark:[--ui-surface-fill:hsl(45_93%_40%_/_0.2)]',
        error: 'text-destructive [--ui-surface-fill:hsl(var(--destructive)/0.12)] dark:[--ui-surface-fill:hsl(var(--destructive)/0.18)]',
    };

    return (
        <div
            className={cn(
                'flex items-center gap-4 rounded-lg p-4',
                variantStyles[variant],
                className,
            )}
            data-slot="info-card"
            data-ui-surface="item"
        >
            {icon && (
                <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    variant === 'default' && 'bg-primary/10 text-primary',
                    variant === 'success' && 'bg-green-500/10 text-green-500',
                    variant === 'warning' && 'bg-yellow-500/10 text-yellow-500',
                    variant === 'error' && 'bg-destructive/10 text-destructive',
                )}>
                    {icon}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold truncate">{value}</p>
            </div>
        </div>
    );
}

// ============================================================================
// Action Card
// ============================================================================

export interface ActionCardProps {
    title: string;
    description?: string;
    action: ReactNode;
    className?: string;
}

export function ActionCard({ title, description, action, className }: ActionCardProps) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-4 rounded-lg p-4',
                className,
            )}
            data-slot="action-card"
            data-ui-surface="interactive"
        >
            <div className="min-w-0 flex-1">
                <p className="font-medium">{title}</p>
                {description && (
                    <p className="text-sm text-muted-foreground truncate">{description}</p>
                )}
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}
