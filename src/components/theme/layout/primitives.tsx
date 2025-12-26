/**
 * 📐 Theme-Aware Layout Components
 * 
 * Responsive layout primitives with theme adaptation.
 * Following SOLID, DRY, and mobile-first design <250 LOC.
 * 
 * @module components/theme/layout
 */

import { type ReactNode, type ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Grid Layout Component (OCP)
// ============================================================================

const gridVariants = cva(
    'grid w-full gap-4',
    {
        variants: {
            cols: {
                1: 'grid-cols-1',
                2: 'grid-cols-1 md:grid-cols-2',
                3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
                6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
                auto: 'grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]',
            },
            gap: {
                sm: 'gap-2',
                md: 'gap-4',
                lg: 'gap-6',
                xl: 'gap-8',
            },
        },
        defaultVariants: {
            cols: 'auto',
            gap: 'md',
        },
    }
);

export interface ThemeGridProps extends VariantProps<typeof gridVariants> {
    children: ReactNode;
    className?: string;
}

export function ThemeGrid({ children, className, cols, gap }: ThemeGridProps) {
    return <div className={cn(gridVariants({ cols, gap }), className)}>{children}</div>;
}

// ============================================================================
// Flex Layout Component (DIP)
// ============================================================================

const flexVariants = cva(
    'flex',
    {
        variants: {
            direction: {
                row: 'flex-row',
                col: 'flex-col',
                'row-reverse': 'flex-row-reverse',
                'col-reverse': 'flex-col-reverse',
            },
            align: {
                start: 'items-start',
                center: 'items-center',
                end: 'items-end',
                stretch: 'items-stretch',
                baseline: 'items-baseline',
            },
            justify: {
                start: 'justify-start',
                center: 'justify-center',
                end: 'justify-end',
                between: 'justify-between',
                around: 'justify-around',
                evenly: 'justify-evenly',
            },
            gap: {
                none: '',
                xs: 'gap-1',
                sm: 'gap-2',
                md: 'gap-4',
                lg: 'gap-6',
                xl: 'gap-8',
            },
            wrap: {
                true: 'flex-wrap',
                false: 'flex-nowrap',
            },
        },
        defaultVariants: {
            direction: 'row',
            align: 'stretch',
            justify: 'start',
            gap: 'md',
            wrap: false,
        },
    }
);

export interface ThemeFlexProps extends VariantProps<typeof flexVariants> {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}

export function ThemeFlex({
    children,
    className,
    direction,
    align,
    justify,
    gap,
    wrap,
    as: Component = 'div',
}: ThemeFlexProps) {
    const Comp = Component;
    return (
        <Comp className={cn(flexVariants({ direction, align, justify, gap, wrap }), className)}>
            {children}
        </Comp>
    );
}

// ============================================================================
// Section Component (SRP)
// ============================================================================

const sectionVariants = cva(
    'w-full transition-all duration-300 ease-out',
    {
        variants: {
            spacing: {
                none: '',
                sm: 'py-8',
                md: 'py-12',
                lg: 'py-16',
                xl: 'py-24',
            },
            background: {
                none: '',
                default: 'bg-background',
                muted: 'bg-muted/30',
                card: 'bg-card',
                gradient: 'bg-gradient-to-b from-background via-muted/20 to-background',
            },
        },
        defaultVariants: {
            spacing: 'md',
            background: 'none',
        },
    }
);

export interface ThemeSectionProps extends VariantProps<typeof sectionVariants> {
    children: ReactNode;
    className?: string;
    as?: ElementType;
}

export function ThemeSection({
    children,
    className,
    spacing,
    background,
    as: Component = 'section',
}: ThemeSectionProps) {
    const Comp = Component;
    return (
        <Comp className={cn(sectionVariants({ spacing, background }), className)}>
            {children}
        </Comp>
    );
}

// ============================================================================
// Stack Component (LSP)
// ============================================================================

export interface ThemeStackProps {
    children: ReactNode;
    className?: string;
    gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    horizontal?: boolean;
}

export function ThemeStack({ children, className, gap = 'md', horizontal = false }: ThemeStackProps) {
    const gapClass = {
        xs: horizontal ? 'gap-1' : 'space-y-1',
        sm: horizontal ? 'gap-2' : 'space-y-2',
        md: horizontal ? 'gap-4' : 'space-y-4',
        lg: horizontal ? 'gap-6' : 'space-y-6',
        xl: horizontal ? 'gap-8' : 'space-y-8',
    }[gap];

    return (
        <div className={cn(horizontal ? `flex ${gapClass}` : gapClass, className)}>
            {children}
        </div>
    );
}
