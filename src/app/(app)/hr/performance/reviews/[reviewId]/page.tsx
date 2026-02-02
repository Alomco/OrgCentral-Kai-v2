import { headers as nextHeaders } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { addDays } from 'date-fns';

import { getSessionContextOrRedirect } from '@/server/ui/auth/session-redirect';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { ReviewForm } from '../../_components/review-form';

interface ReviewDetailPageProps {
    params: Promise<{ reviewId: string }>;
}

const REVIEW_REFERENCE_DATE = new Date('2024-01-01T00:00:00Z');

function getStatusDetails(status: string): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    switch (status) {
        case 'COMPLETED':
            return { label: 'Completed', variant: 'default' };
        case 'IN_PROGRESS':
            return { label: 'In Progress', variant: 'secondary' };
        case 'PENDING':
            return { label: 'Pending', variant: 'outline' };
        case 'OVERDUE':
            return { label: 'Overdue', variant: 'destructive' };
        default:
            return { label: status, variant: 'outline' };
    }
}

function formatDate(date: Date | string | null | undefined): string {
    if (!date) { return '—'; }
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
    const { reviewId } = await params;
    const headerStore = await nextHeaders();
    await getSessionContextOrRedirect(
        {},
        {
            headers: headerStore,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'ui:hr:performance:review-detail',
        },
    );

    // Placeholder review data
    // In real implementation, this would fetch from the performance service
    const review = {
        id: reviewId,
        title: 'Q4 2024 Performance Review',
        type: 'Self-Assessment',
        status: 'IN_PROGRESS',
        dueDate: addDays(REVIEW_REFERENCE_DATE, 14),
        createdAt: addDays(REVIEW_REFERENCE_DATE, -7),
        employee: {
            id: 'user-123',
            name: 'John Doe',
            jobTitle: 'Software Engineer',
        },
        questions: [
            { id: 'q1', question: 'How well did you achieve your goals this quarter?', category: 'Goal Achievement' },
            { id: 'q2', question: 'What were your key accomplishments?', category: 'Goal Achievement' },
            { id: 'q3', question: 'How effectively did you collaborate with your team?', category: 'Teamwork' },
            { id: 'q4', question: 'How well did you communicate with stakeholders?', category: 'Communication' },
            { id: 'q5', question: 'What skills did you develop this quarter?', category: 'Professional Growth' },
        ],
    };

    const statusDetails = getStatusDetails(review.status);

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr">HR</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/hr/performance">Performance</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{review.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Back Button */}
            <Button variant="ghost" size="sm" asChild>
                <Link href="/hr/performance">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Performance
                </Link>
            </Button>

            {/* Review Header */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="min-w-0 break-words">{review.title}</CardTitle>
                                <Badge variant={statusDetails.variant}>
                                    {statusDetails.label}
                                </Badge>
                            </div>
                            <CardDescription>
                                {review.type}. Complete the questions below. You can return later if needed.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 whitespace-nowrap">
                                <Calendar className="h-4 w-4" />
                                Due: {formatDate(review.dueDate)}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <Link
                                href={`/hr/employees/${review.employee.id}`}
                                className="font-medium hover:underline truncate"
                                title={review.employee.name}
                            >
                                {review.employee.name}
                            </Link>
                            <p className="text-sm text-muted-foreground truncate" title={review.employee.jobTitle}>
                                {review.employee.jobTitle}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review Form */}
            <ReviewForm
                reviewId={review.id}
                reviewTitle={review.title}
                questions={review.questions}
            />
        </div>
    );
}
