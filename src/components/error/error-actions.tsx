'use client';

import { Button } from '@/components/ui/button';

interface ErrorRetryButtonProps {
    reset: () => void;
    label?: string;
}

/**
 * Minimal client island for error page retry functionality.
 * Isolated to keep error page layouts as Server Components.
 */
export function ErrorRetryButton({ reset, label = 'Try again' }: ErrorRetryButtonProps) {
    return (
        <Button
            type="button"
            onClick={reset}
            size="lg"
            className="px-6 shadow-[0_15px_45px_-22px_hsl(var(--primary)/0.85)] hover:shadow-[0_18px_55px_-20px_hsl(var(--primary)/0.95)] motion-safe:translate-y-0 motion-safe:hover:-translate-y-px"
        >
            {label}
        </Button>
    );
}
