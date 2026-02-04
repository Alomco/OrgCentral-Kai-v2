import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { getOnboardingFeedbackForUi } from '@/server/use-cases/hr/onboarding/feedback/list-feedback.cached';
import type { OnboardingFeedbackRecord } from '@/server/types/hr/onboarding-feedback';

export interface OnboardingFeedbackPanelProps {
    authorization: RepositoryAuthorizationContext;
}

function formatSubmittedAt(value: OnboardingFeedbackRecord['submittedAt']): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toISOString().slice(0, 10);
}

export async function OnboardingFeedbackPanel({ authorization }: OnboardingFeedbackPanelProps) {
    const result = await getOnboardingFeedbackForUi({ authorization });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Onboarding feedback</CardTitle>
                <CardDescription>
                    Review employee feedback and satisfaction ratings.
                </CardDescription>
            </CardHeader>
            {!result.canManageFeedback ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        You do not have access to view onboarding feedback in this organization.
                    </div>
                </CardContent>
            ) : result.feedback.length === 0 ? (
                <CardContent>
                    <div className="text-sm text-muted-foreground">No feedback submitted yet.</div>
                </CardContent>
            ) : (
                <CardContent className="space-y-3">
                    <div className="overflow-auto">
                        <Table className="min-w-[640px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="text-right">Rating</TableHead>
                                    <TableHead>Summary</TableHead>
                                    <TableHead className="text-right">Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.feedback.map((feedback) => (
                                    <TableRow key={feedback.id}>
                                        <TableCell className="font-medium min-w-0 max-w-60 truncate">
                                            {feedback.employeeId}
                                        </TableCell>
                                        <TableCell className="text-right">{feedback.rating}</TableCell>
                                        <TableCell className="min-w-[220px] text-xs text-muted-foreground">
                                            {feedback.summary ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatSubmittedAt(feedback.submittedAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Feedback is cached per-org when data classification is OFFICIAL.
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
