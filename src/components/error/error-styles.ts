import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Error page card variants using CVA pattern.
 * Provides consistent styling across all error pages with variant-based theming.
 */
export const errorCardVariants = cva(
    [
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--card))] to-[hsl(var(--muted))]',
        'p-8 shadow-[0_25px_80px_-30px_hsl(var(--primary)/0.4)]',
        'motion-reduce:transition-none',
    ],
    {
        variants: {
            intent: {
                danger: 'shadow-[0_25px_80px_-30px_hsl(var(--destructive)/0.35)]',
                warning: 'shadow-[0_25px_80px_-30px_hsl(48,96%,53%,0.35)]',
                info: 'shadow-[0_25px_80px_-30px_hsl(var(--primary)/0.4)]',
            },
        },
        defaultVariants: {
            intent: 'danger',
        },
    },
);

export const errorTitleVariants = cva(
    [
        'bg-clip-text text-transparent',
        'text-3xl font-semibold tracking-tight',
        'text-shadow-[0_12px_40px_hsl(var(--primary)/0.2)]',
    ],
    {
        variants: {
            intent: {
                danger: 'bg-gradient-to-r from-[hsl(var(--destructive))] via-[hsl(var(--accent))] to-[hsl(var(--primary))]',
                warning: 'bg-gradient-to-r from-[hsl(48,96%,45%)] via-[hsl(31,87%,51%)] to-[hsl(var(--accent))]',
                info: 'bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--accent))] to-[hsl(var(--chart-3))]',
            },
        },
        defaultVariants: {
            intent: 'danger',
        },
    },
);

export type ErrorCardIntent = VariantProps<typeof errorCardVariants>['intent'];
