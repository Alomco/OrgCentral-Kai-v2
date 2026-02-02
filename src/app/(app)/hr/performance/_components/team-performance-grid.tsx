import { Users, Award, Target } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface TeamMemberPerformance {
    id: string;
    name: string;
    jobTitle: string;
    goalProgress: number;
    reviewStatus: 'pending' | 'completed' | 'scheduled' | 'none';
    lastReviewRating?: number;
}

interface TeamPerformanceGridProps {
    teamMembers: TeamMemberPerformance[];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function getReviewStatusDetails(status: TeamMemberPerformance['reviewStatus']): {
    label: string;
    variant: 'default' | 'secondary' | 'outline';
} {
    switch (status) {
        case 'completed':
            return { label: 'Completed', variant: 'default' };
        case 'scheduled':
            return { label: 'Scheduled', variant: 'secondary' };
        case 'pending':
            return { label: 'Pending', variant: 'outline' };
        case 'none':
        default:
            return { label: 'None', variant: 'outline' };
    }
}

function getRatingColor(rating: number): string {
    if (rating >= 4) { return 'text-emerald-500'; }
    if (rating >= 3) { return 'text-blue-500'; }
    if (rating >= 2) { return 'text-amber-500'; }
    return 'text-red-500';
}

export function TeamPerformanceGrid({ teamMembers }: TeamPerformanceGridProps) {
    const avgGoalProgress =
        teamMembers.length > 0
            ? Math.round(
                teamMembers.reduce((sum, m) => sum + m.goalProgress, 0) / teamMembers.length,
            )
            : 0;

    const completedReviews = teamMembers.filter((m) => m.reviewStatus === 'completed').length;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Performance
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {completedReviews} of {teamMembers.length} reviews completed | {avgGoalProgress}%
                        avg goal progress
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {teamMembers.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {teamMembers.map((member) => {
                            const statusDetails = getReviewStatusDetails(member.reviewStatus);

                            return (
                                <Link
                                    key={member.id}
                                    href={`/hr/employees/${member.id}?tab=development`}
                                    className="rounded-lg border p-4 transition-colors hover:bg-muted"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {member.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.jobTitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {/* Goal Progress */}
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <Target className="h-3 w-3" />
                                                Goals
                                            </span>
                                            <span>{member.goalProgress}%</span>
                                        </div>
                                        <Progress value={member.goalProgress} className="h-1.5" />

                                        {/* Review Status & Rating */}
                                        <div className="flex items-center justify-between pt-1">
                                            <Badge variant={statusDetails.variant} className="text-xs">
                                                {statusDetails.label}
                                            </Badge>
                                            {member.lastReviewRating !== undefined ? (
                                                <span
                                                    className={`flex items-center gap-1 text-sm font-medium ${getRatingColor(member.lastReviewRating)}`}
                                                >
                                                    <Award className="h-3.5 w-3.5" />
                                                    {member.lastReviewRating.toFixed(1)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium">No Team Members</p>
                        <p className="text-xs text-muted-foreground">
                            Team performance data will appear here once you have direct reports
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
