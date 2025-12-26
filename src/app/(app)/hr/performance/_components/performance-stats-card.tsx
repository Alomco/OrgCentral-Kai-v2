import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, Star } from 'lucide-react';

export interface PerformanceStatsCardProps {
    totalReviews: number;
    pendingReviews: number;
    averageRating: number | null;
    nextReviewDate: Date | null;
}

function formatDate(date: Date | null): string {
    if (!date) {return 'Not scheduled';}
    return new Date(date).toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function PerformanceStatsCard({
    totalReviews,
    pendingReviews,
    averageRating,
    nextReviewDate,
}: PerformanceStatsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Overview
                </CardTitle>
                <CardDescription>Your performance at a glance.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatItem
                        icon={<Target className="h-4 w-4" />}
                        label="Total Reviews"
                        value={totalReviews.toString()}
                    />
                    <StatItem
                        icon={<Calendar className="h-4 w-4" />}
                        label="Pending"
                        value={pendingReviews.toString()}
                        highlight={pendingReviews > 0}
                    />
                    <StatItem
                        icon={<Star className="h-4 w-4" />}
                        label="Avg Rating"
                        value={averageRating ? `${averageRating.toFixed(1)}/5` : '—'}
                    />
                    <StatItem
                        icon={<Calendar className="h-4 w-4" />}
                        label="Next Review"
                        value={formatDate(nextReviewDate)}
                        small
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function StatItem({
    icon,
    label,
    value,
    highlight = false,
    small = false,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    highlight?: boolean;
    small?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors motion-reduce:transition-none hover:bg-muted/50">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`font-semibold ${small ? 'text-sm' : 'text-lg'} ${highlight ? 'text-primary' : ''}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}
