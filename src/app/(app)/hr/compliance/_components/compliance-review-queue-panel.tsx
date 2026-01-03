import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import {
    listPendingReviewComplianceItems,
    type ListPendingReviewComplianceItemsDependencies,
} from '@/server/use-cases/hr/compliance/list-pending-review-items';

import { formatHumanDate } from '../../_components/format-date';
import { complianceItemStatusBadgeVariant } from '../../_components/hr-badge-variants';
import { reviewComplianceItemAction } from '../actions/review-item';

export interface ComplianceReviewQueuePanelProps {
    authorization: RepositoryAuthorizationContext;
}

function formatDate(value: Date | null | undefined): string {
    if (!value) {
        return '—';
    }
    return formatHumanDate(value);
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function renderAttachments(value: string[] | null | undefined): React.ReactNode {
    if (!value || value.length === 0) {
        return '—';
    }

    const shown = value.slice(0, 2);
    const remainder = value.length - shown.length;

    return (
        <>
            {shown.map((item, index) => {
                const prefix = index === 0 ? '' : ', ';
                if (isHttpUrl(item)) {
                    return (
                        <span key={item}>
                            {prefix}
                            <a
                                href={item}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                link
                            </a>
                        </span>
                    );
                }
                return (
                    <span key={item}>
                        {prefix}
                        {item}
                    </span>
                );
            })}
            {remainder > 0 ? ` … (+${String(remainder)})` : null}
        </>
    );
}

export async function ComplianceReviewQueuePanel({ authorization }: ComplianceReviewQueuePanelProps) {
    const useCaseDeps: ListPendingReviewComplianceItemsDependencies = {
        complianceItemRepository: new PrismaComplianceItemRepository(),
    };

    const items = await listPendingReviewComplianceItems(useCaseDeps, { authorization, take: 100 });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Pending verification</CardTitle>
                <CardDescription>
                    Items awaiting an admin review (status: <span className="font-medium">PENDING_REVIEW</span>).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nothing pending review.</div>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Attachments</TableHead>
                                    <TableHead className="text-right">Review</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.userId}</TableCell>
                                        <TableCell>{item.templateItemId}</TableCell>
                                        <TableCell>
                                            <Badge variant={complianceItemStatusBadgeVariant(item.status)}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(item.dueDate)}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
                                        <TableCell className="max-w-88 truncate" title={item.notes ?? undefined}>
                                            {item.notes ?? '—'}
                                        </TableCell>
                                        <TableCell className="max-w-88 truncate">
                                            {renderAttachments(item.attachments)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <form action={reviewComplianceItemAction} className="flex flex-col items-end gap-2">
                                                <input type="hidden" name="userId" value={item.userId} />
                                                <input type="hidden" name="itemId" value={item.id} />

                                                <label htmlFor={`reject-notes-${item.id}`} className="sr-only">
                                                    Rejection notes (optional)
                                                </label>
                                                <Textarea
                                                    id={`reject-notes-${item.id}`}
                                                    name="notes"
                                                    placeholder="Rejection notes (optional)"
                                                    className="w-[18rem]"
                                                    defaultValue=""
                                                />

                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="submit"
                                                        name="decision"
                                                        value="approve"
                                                        className="text-sm font-medium underline underline-offset-4"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        name="decision"
                                                        value="reject"
                                                        className="text-sm font-medium underline underline-offset-4"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
