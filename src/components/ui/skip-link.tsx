/**
 * Accessible Skip Link
 *
 * Provides a focusable skip navigation link for keyboard and screen reader users.
 *
 * @module components/ui/skip-link
 */

import { cn } from '@/lib/utils';

export interface SkipLinkProps {
    targetId: string;
    label?: string;
    className?: string;
}

export function SkipLink({ targetId, label = 'Skip to content', className }: SkipLinkProps) {
    return (
        <a
            href={`#${targetId}`}
            data-slot="skip-link"
            className={cn(
                'sr-only rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground',
                'focus:not-sr-only focus:fixed focus:left-6 focus:top-4 focus:z-(--z-overlay)',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                className,
            )}
        >
            {label}
        </a>
    );
}
