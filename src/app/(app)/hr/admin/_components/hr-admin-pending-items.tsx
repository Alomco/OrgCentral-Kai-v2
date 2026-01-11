import Link from 'next/link';
import { Clock, Calendar, FileCheck, ArrowRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PendingApprovalItem } from '../actions.types';

interface HrAdminPendingItemsProps {
    items: PendingApprovalItem[];
}

function getItemIcon(type: PendingApprovalItem['type']) {
    switch (type) {
        case 'leave':
            return <Calendar className="h-4 w-4 text-blue-500" />;
        case 'compliance':
            return <FileCheck className="h-4 w-4 text-amber-500" />;
        case 'onboarding':
            return <Clock className="h-4 w-4 text-emerald-500" />;
        default:
            return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
}

function getItemHref(item: PendingApprovalItem): string {
    switch (item.type) {
        case 'leave':
            return `/hr/leave/${item.id}`;
        case 'compliance':
            return `/hr/compliance/${item.id}`;
        case 'onboarding':
            return `/hr/onboarding/${item.id}`;
        default:
            return '/hr';
    }
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {return `${String(days)}d ago`;}
    if (hours > 0) {return `${String(hours)}h ago`;}
    if (minutes > 0) {return `${String(minutes)}m ago`;}
    return 'Just now';
}

/**
 * Pending items panel showing items awaiting HR admin action
 */
export function HrAdminPendingItems({ items }: HrAdminPendingItemsProps) {
    const hasItems = items.length > 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Approvals
                    </CardTitle>
                    <CardDescription>Items awaiting your review</CardDescription>
                </div>
                {hasItems ? (
                    <Badge variant="secondary">{items.length}</Badge>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
                {hasItems ? (
                    <>
                        {items.slice(0, 5).map((item) => (
                            <Link
                                key={item.id}
                                href={getItemHref(item)}
                                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {getItemIcon(item.type)}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {item.submittedBy}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                    {formatTimeAgo(item.submittedAt)}
                                </span>
                            </Link>
                        ))}
                        {items.length > 5 ? (
                            <Button variant="ghost" size="sm" className="w-full" asChild>
                                <Link href="/hr/leave">
                                    View all {items.length} items
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </Button>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-sm font-medium">No Pending Items</p>
                        <p className="text-xs text-muted-foreground">
                            All caught up! Check back later.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
