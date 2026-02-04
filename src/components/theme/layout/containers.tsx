/**
 * 🎨 Premium Layout Primitives
 * 
 * Reusable layout components with futuristic styling.
 * Server Components with CSS-first effects.
 * 
 * @module components/theme/layout
 */

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import motionStyles from '@/styles/motion/view-transitions.module.css';

// ============================================================================
// Page Container
// ============================================================================

const pageContainerVariants = cva('min-h-screen w-full', {
    variants: {
        padding: {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        },
        maxWidth: {
            full: '',
            xl: 'max-w-screen-xl mx-auto',
            '2xl': 'max-w-screen-2xl mx-auto',
        },
    },
    defaultVariants: {
        padding: 'md',
        maxWidth: 'full',
    },
});

export interface PageContainerProps extends VariantProps<typeof pageContainerVariants> {
    children: ReactNode;
    className?: string;
}

export function PageContainer({ children, padding, maxWidth, className }: PageContainerProps) {
    return (
        <div className={cn(pageContainerVariants({ padding, maxWidth }), className)}>
            {children}
        </div>
    );
}

// ============================================================================
// Page Header
// ============================================================================

export interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, icon, className }: PageHeaderProps) {
    return (
        <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6', className)}>
            <div className="flex min-w-0 items-start gap-4">
                {icon && (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
                        {icon}
                    </div>
                )}
                <div className="min-w-0 space-y-1">
                    <h1 className={cn('text-2xl font-bold tracking-tight lg:text-3xl', motionStyles.sharedTitle)}>
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            )}
        </header>
    );
}

// ============================================================================
// Section Container
// ============================================================================

const sectionVariants = cva('', {
    variants: {
        spacing: {
            none: '',
            sm: 'space-y-4',
            md: 'space-y-6',
            lg: 'space-y-8',
        },
    },
    defaultVariants: {
        spacing: 'md',
    },
});

export interface SectionProps extends VariantProps<typeof sectionVariants> {
    children: ReactNode;
    title?: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function Section({ children, title, description, actions, spacing, className }: SectionProps) {
    const hasHeader = Boolean(title ?? description ?? actions);

    return (
        <section className={cn(sectionVariants({ spacing }), className)}>
            {hasHeader && (
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        {title && <h2 className="text-lg font-semibold">{title}</h2>}
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

// ============================================================================
// Content Grid
// ============================================================================

const gridVariants = cva('grid gap-6', {
    variants: {
        cols: {
            1: 'grid-cols-1',
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        },
    },
    defaultVariants: {
        cols: 2,
    },
});

export interface ContentGridProps extends VariantProps<typeof gridVariants> {
    children: ReactNode;
    className?: string;
}

export function ContentGrid({ children, cols, className }: ContentGridProps) {
    return <div className={cn(gridVariants({ cols }), className)}>{children}</div>;
}
