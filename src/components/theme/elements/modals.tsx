/**
 * 🪟 Premium Modal Components
 * 
 * Enhanced dialog and modal wrappers with premium styling.
 * Client Component for interactivity.
 * 
 * @module components/theme/elements/modals
 */

'use client';

import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ============================================================================
// Premium Modal
// ============================================================================

const modalVariants = cva('', {
    variants: {
        size: {
            sm: 'sm:max-w-sm',
            md: 'sm:max-w-md',
            lg: 'sm:max-w-lg',
            xl: 'sm:max-w-xl',
            '2xl': 'sm:max-w-2xl',
            full: 'sm:max-w-[90vw] sm:max-h-[90vh]',
        },
        variant: {
            default: '',
            glass: 'bg-card border-border/40',
            gradient: 'bg-gradient-to-br from-card via-card to-card',
        },
    },
    defaultVariants: {
        size: 'md',
        variant: 'default',
    },
});

export interface PremiumModalProps extends VariantProps<typeof modalVariants> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function PremiumModal({
    open,
    onOpenChange,
    title,
    description,
    icon,
    children,
    footer,
    size,
    variant,
    className,
}: PremiumModalProps) {
    const hasHeader = Boolean(title ?? description);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(modalVariants({ size, variant }), className)}
                data-slot="premium-modal"
            >
                {hasHeader && (
                    <DialogHeader>
                        {title && (
                            <DialogTitle className="flex items-center gap-3">
                                {icon && (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                                        {icon}
                                    </div>
                                )}
                                <span>{title}</span>
                            </DialogTitle>
                        )}
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>
                )}
                <div className="py-4">{children}</div>
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// Confirmation Modal
// ============================================================================

export interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
    loading?: boolean;
}

export function ConfirmModal({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    variant = 'default',
    loading = false,
}: ConfirmModalProps) {
    return (
        <PremiumModal
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            size="sm"
            footer={
                <div className="flex gap-2 w-full sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={loading}>
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : confirmLabel}
                    </Button>
                </div>
            }
        >
            <div className="text-sm text-muted-foreground">
                This action cannot be undone.
            </div>
        </PremiumModal>
    );
}
