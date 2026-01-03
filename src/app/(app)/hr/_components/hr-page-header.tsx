import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface HrPageHeaderProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
};

/**
 * 🌈 HR Page Header with futuristic gradient styling
 * Automatically uses tenant theme colors via CSS variables
 */
export function HrPageHeader({
    title,
    description,
    icon,
    actions,
    size = 'md',
}: HrPageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
                {icon ? (
                    <div className={cn(
                        'flex items-center justify-center rounded-xl p-2.5',
                        'bg-linear-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]',
                        'text-white shadow-lg shadow-[hsl(var(--primary)/0.3)]',
                        'transition-transform duration-200 hover:scale-105',
                    )}>
                        {icon}
                    </div>
                ) : null}
                <div>
                    <h1 className={cn(
                        sizeStyles[size],
                        'font-bold tracking-tight',
                        // Gradient text - uses bright colors that stay visible in dark mode
                        // Goes: primary → light primary → accent → light accent for full visibility
                        'bg-linear-to-r',
                        'from-[hsl(var(--primary))]',
                        'via-[hsl(var(--accent))]',
                        'to-[hsl(var(--primary))]',
                        'bg-clip-text text-transparent',
                        'bg-size-[200%_100%]',
                    )}>
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    ) : null}
                </div>
            </div>
            {actions ? (
                <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
        </div>
    );
}

