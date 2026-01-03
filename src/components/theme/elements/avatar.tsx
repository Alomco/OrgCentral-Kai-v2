/**
 * Premium Avatar Components
 *
 * Enhanced avatars with status indicators, groups, and premium styling.
 * Server Component with CVA variants.
 *
 * @module components/theme/elements/avatar
 */

import type { ReactNode } from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// Premium Avatar
// ============================================================================

const avatarVariants = cva(
    'relative inline-flex shrink-0 overflow-hidden rounded-full transition-all',
    {
        variants: {
            size: {
                xs: 'h-6 w-6 text-[10px]',
                sm: 'h-8 w-8 text-xs',
                md: 'h-10 w-10 text-sm',
                lg: 'h-12 w-12 text-base',
                xl: 'h-16 w-16 text-lg',
                '2xl': 'h-20 w-20 text-xl',
            },
            ring: {
                none: '',
                default: 'shadow-[0_0_0_2px_hsl(var(--background))]',
                primary: 'shadow-[0_0_0_2px_hsl(var(--primary))]',
                gradient: 'shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_4px_hsl(var(--primary)/0.4)]',
            },
            interactive: {
                true: 'cursor-pointer hover:scale-105 hover:shadow-[0_0_0_2px_hsl(var(--primary)/0.5)] active:scale-95',
                false: '',
            },
        },
        defaultVariants: {
            size: 'md',
            ring: 'none',
            interactive: false,
        },
    }
);

export interface PremiumAvatarProps extends VariantProps<typeof avatarVariants> {
    /** Image source */
    src?: string;
    /** Alt text */
    alt?: string;
    /** Fallback initials or content */
    fallback?: ReactNode;
    /** Status indicator */
    status?: 'online' | 'offline' | 'away' | 'busy';
    /** Additional class */
    className?: string;
}

export function PremiumAvatar({
    src,
    alt,
    fallback,
    status,
    size,
    ring,
    interactive,
    className,
}: PremiumAvatarProps) {
    const initials = typeof fallback === 'string' ? fallback.slice(0, 2).toUpperCase() : fallback;
    const pixelSize = resolveAvatarPixelSize(size);

    return (
        <div className={cn(avatarVariants({ size, ring, interactive }), className)} data-slot="premium-avatar">
            {src ? (
                <Image
                    src={src}
                    alt={alt ?? ''}
                    width={pixelSize}
                    height={pixelSize}
                    sizes={`${String(pixelSize)}px`}
                    className="aspect-square h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {initials ?? '?'}
                </div>
            )}
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 block rounded-full shadow-[0_0_0_2px_hsl(var(--background))]',
                        size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
                        status === 'online' && 'bg-green-500',
                        status === 'away' && 'bg-yellow-500',
                        status === 'busy' && 'bg-orange-500',
                        status === 'offline' && 'bg-muted-foreground',
                    )}
                    aria-label={`Status: ${status}`}
                />
            )}
        </div>
    );
}

// ============================================================================
// Avatar Group
// ============================================================================

export interface AvatarGroupProps {
    children: ReactNode;
    /** Max visible avatars */
    max?: number;
    /** Total count for overflow */
    total?: number;
    /** Additional class */
    className?: string;
}

export function AvatarGroup({ children, max = 4, total, className }: AvatarGroupProps) {
    const childArray = Array.isArray(children) ? children : [children];
    const visible = childArray.slice(0, max);
    const overflow = total ? total - max : childArray.length - max;

    const zIndexClassByPosition = ['z-50', 'z-40', 'z-30', 'z-20', 'z-10', 'z-0'] as const;

    return (
        <div className={cn('flex -space-x-3', className)}>
            {visible.map((child, index) => (
                <div
                    key={index}
                    className={cn(
                        'relative',
                        zIndexClassByPosition[Math.min(index, zIndexClassByPosition.length - 1)],
                    )}
                >
                    {child}
                </div>
            ))}
            {overflow > 0 && (
                <div
                    className="relative z-0 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground shadow-[0_0_0_2px_hsl(var(--background))]"
                >
                    +{overflow}
                </div>
            )}
        </div>
    );
}

const AVATAR_PIXEL_SIZES: Record<NonNullable<PremiumAvatarProps['size']>, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
};

function resolveAvatarPixelSize(size: PremiumAvatarProps['size']): number {
    if (!size) {
        return AVATAR_PIXEL_SIZES.md;
    }
    return AVATAR_PIXEL_SIZES[size];
}

