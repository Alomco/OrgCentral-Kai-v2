'use client';

import { useState, useTransition } from 'react';
import { Check, CheckCircle2, Circle, Clock, ListChecks, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { ChecklistInstance, ChecklistItemProgress } from '@/server/types/onboarding-types';

export interface ActiveChecklistCardProps {
    instance: ChecklistInstance;
    onToggleItem?: (instanceId: string, itemIndex: number, completed: boolean) => Promise<ChecklistActionResult | undefined>;
    onComplete?: (instanceId: string) => Promise<ChecklistActionResult | undefined>;
    className?: string;
}

export interface ChecklistActionResult {
    success: boolean;
    error?: string;
}

function formatDate(date: Date | string | null | undefined): string {
    if (!date) {return '';}
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function ActiveChecklistCard({
    instance,
    onToggleItem,
    onComplete,
    className,
}: ActiveChecklistCardProps) {
    const [isPending, startTransition] = useTransition();
    const [pendingItemIndex, setPendingItemIndex] = useState<number | null>(null);

    const completedCount = instance.items.filter((item) => item.completed).length;
    const totalCount = instance.items.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const allComplete = completedCount === totalCount;

    const handleToggleItem = (itemIndex: number, currentCompleted: boolean) => {
        if (!onToggleItem || isPending) {return;}

        setPendingItemIndex(itemIndex);
        startTransition(async () => {
            try {
                await onToggleItem(instance.id, itemIndex, !currentCompleted);
            } finally {
                setPendingItemIndex(null);
            }
        });
    };

    const handleComplete = () => {
        if (!onComplete || isPending || !allComplete) {return;}

        startTransition(async () => {
            await onComplete(instance.id);
        });
    };

    const statusBadge = {
        IN_PROGRESS: { label: 'In Progress', variant: 'default' as const },
        COMPLETED: { label: 'Completed', variant: 'secondary' as const },
        CANCELLED: { label: 'Cancelled', variant: 'outline' as const },
    }[instance.status];

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle className="text-base">
                                {instance.templateName ?? 'Onboarding Checklist'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Started {formatDate(instance.startedAt)}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                            {completedCount} / {totalCount} tasks
                        </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                </div>

                {/* Items list */}
                <div className="space-y-2">
                    {instance.items.map((item, index) => (
                        <ChecklistItem
                            key={`${item.task}-${String(index)}`}
                            item={item}
                            onToggle={
                                instance.status === 'IN_PROGRESS' && onToggleItem
                                    ? () => handleToggleItem(index, item.completed)
                                    : undefined
                            }
                            isPending={pendingItemIndex === index}
                            disabled={isPending || instance.status !== 'IN_PROGRESS'}
                        />
                    ))}
                </div>
            </CardContent>

            {instance.status === 'IN_PROGRESS' && onComplete && (
                <CardFooter className="border-t bg-muted/30 pt-4">
                    <Button
                        onClick={handleComplete}
                        disabled={isPending || !allComplete}
                        className="w-full"
                        variant={allComplete ? 'default' : 'secondary'}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Completing...
                            </>
                        ) : allComplete ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Complete Onboarding
                            </>
                        ) : (
                            <>
                                <Clock className="mr-2 h-4 w-4" />
                                Complete all tasks first
                            </>
                        )}
                    </Button>
                </CardFooter>
            )}

            {instance.status === 'COMPLETED' && instance.completedAt && (
                <CardFooter className="border-t bg-green-50 dark:bg-green-950/20 pt-4">
                    <div className="flex w-full items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed on {formatDate(instance.completedAt)}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}

interface ChecklistItemProps {
    item: ChecklistItemProgress;
    onToggle?: () => void;
    isPending?: boolean;
    disabled?: boolean;
}

function ChecklistItem({ item, onToggle, isPending, disabled }: ChecklistItemProps) {
    const isInteractive = Boolean(onToggle);

    const className = cn(
        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
        item.completed && 'bg-muted/50',
        isInteractive && !disabled && 'cursor-pointer hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-70',
    );

    if (isInteractive) {
        return (
            <button
                type="button"
                className={className}
                onClick={onToggle}
                disabled={Boolean(disabled)}
            >
                <div className="mt-0.5 shrink-0">
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : item.completed ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1 space-y-0.5">
                    <p
                        className={cn(
                            'text-sm font-medium',
                            item.completed && 'text-muted-foreground line-through',
                        )}
                    >
                        {item.task}
                    </p>
                    {item.notes && (
                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                    )}
                    {item.completed && item.completedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                            Completed {formatDate(item.completedAt)}
                        </p>
                    )}
                </div>
            </button>
        );
    }

    return (
        <div className={className}>
            <div className="mt-0.5 shrink-0">
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : item.completed ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                )}
            </div>
            <div className="flex-1 space-y-0.5">
                <p
                    className={cn(
                        'text-sm font-medium',
                        item.completed && 'text-muted-foreground line-through',
                    )}
                >
                    {item.task}
                </p>
                {item.notes && (
                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                )}
                {item.completed && item.completedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                        Completed {formatDate(item.completedAt)}
                    </p>
                )}
            </div>
        </div>
    );
}
