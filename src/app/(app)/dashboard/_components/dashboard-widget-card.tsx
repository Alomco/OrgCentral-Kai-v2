import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type DashboardWidgetState = 'ready' | 'locked' | 'comingSoon' | 'error';

export interface DashboardWidgetCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    value?: string;
    href?: string;
    ctaLabel?: string;
    state?: DashboardWidgetState;
    statusLabel?: string;
    footerHint?: ReactNode;
}

export function DashboardWidgetCard(props: DashboardWidgetCardProps) {
    const state = props.state ?? 'ready';
    const Icon = props.icon;

    const navigation =
        state === 'ready' && props.href && props.ctaLabel
            ? { href: props.href, label: props.ctaLabel }
            : null;

    const statusBadge =
        state === 'locked'
            ? { label: props.statusLabel ?? 'Locked', variant: 'destructive' as const }
            : state === 'comingSoon'
                ? { label: props.statusLabel ?? 'Coming soon', variant: 'secondary' as const }
                : state === 'error'
                    ? { label: props.statusLabel ?? 'Error', variant: 'destructive' as const }
                    : null;

    return (
        <article className="group h-full">
            <Card className="flex h-full flex-col rounded-lg border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-6 relative z-10">
                    <div className="min-w-0 flex-1 space-y-2">
                        <CardTitle className="text-lg font-semibold leading-tight">{props.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {props.description}
                        </CardDescription>
                    </div>
                    <div className="flex items-center justify-center rounded-lg bg-muted/60 p-2.5 text-foreground shadow-inner shrink-0">
                        <Icon className="h-5 w-5" />
                    </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 p-6 pt-0 relative z-10">
                    {state === 'error' ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
                            <div className="text-base font-semibold">{statusBadge?.label ?? 'Error'}</div>
                            {props.footerHint ? (
                                <div className="text-sm text-center text-muted-foreground leading-relaxed line-clamp-2 break-words">
                                    {props.footerHint}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-4xl font-bold tracking-tight">
                                    {props.value ?? '0'}
                                </div>
                                {statusBadge ? (
                                    <Badge variant={statusBadge.variant} className="shrink-0 text-xs">
                                        {statusBadge.label}
                                    </Badge>
                                ) : null}
                            </div>
                            {props.footerHint ? (
                                <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words">
                                    {props.footerHint}
                                </div>
                            ) : null}
                        </>
                    )}
                    <div className="mt-auto pt-4">
                        {navigation ? (
                            <Button asChild className="w-full" size="sm" variant="default">
                                <Link href={navigation.href}>{navigation.label}</Link>
                            </Button>
                        ) : props.href && props.ctaLabel ? (
                            <Button className="w-full" size="sm" variant="secondary" disabled>
                                {props.ctaLabel}
                            </Button>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </article>
    );
}
