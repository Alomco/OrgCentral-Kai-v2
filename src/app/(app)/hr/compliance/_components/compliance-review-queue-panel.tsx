import { unstable_noStore as noStore } from 'next/cache';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import {
    listPendingReviewComplianceItems,
    type ListPendingReviewComplianceItemsDependencies,
} from '@/server/use-cases/hr/compliance/list-pending-review-items';
import { listComplianceTemplates } from '@/server/use-cases/hr/compliance/list-compliance-templates';
import type { PrismaJsonValue } from '@/server/types/prisma';
import type { ComplianceAttachment } from '@/server/types/compliance-types';

import { formatHumanDate } from '../../_components/format-date';
import { complianceItemStatusBadgeVariant } from '../../_components/hr-badge-variants';
import { reviewComplianceItemAction } from '../actions/review-item';
import { buildTemplateItemLookup } from './compliance-template-lookup';

export interface ComplianceReviewQueuePanelProps {
    authorization: RepositoryAuthorizationContext;
}

function formatDate(value: Date | null | undefined): string {
    if (!value) {
        return '-';
    }
    return formatHumanDate(value);
}

function isRecord(
    value: PrismaJsonValue | null | undefined,
): value is Record<string, PrismaJsonValue> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getEvidenceSummary(metadata: PrismaJsonValue | null | undefined): string[] {
    if (!isRecord(metadata)) {
        return [];
    }

    const evidence: string[] = [];
    const acknowledgement = metadata.acknowledgement;
    if (isRecord(acknowledgement) && typeof acknowledgement.accepted === 'boolean') {
        evidence.push(`Acknowledged: ${acknowledgement.accepted ? 'Yes' : 'No'}`);
    }

    const yesNo = metadata.yesNo;
    if (isRecord(yesNo) && (yesNo.value === 'YES' || yesNo.value === 'NO')) {
        evidence.push(`Yes/No: ${yesNo.value}`);
    }

    return evidence;
}

function renderAttachments(value: ComplianceAttachment[] | null | undefined): React.ReactNode {
    if (!value || value.length === 0) {
        return 'None';
    }

    const shown = value.slice(0, 2);
    const remainder = value.length - shown.length;

    return (
        <div className="space-y-1 text-xs">
            {shown.map((item) => (
                <div key={item.documentId} className="flex items-center gap-2">
                    <a
                        href={`/api/hr/documents/${item.documentId}/download`}
                        className="underline underline-offset-4"
                    >
                        {item.fileName}
                    </a>
                    <span className="text-muted-foreground">
                        {item.classification} / {item.retentionPolicy} / v{String(item.version)}
                    </span>
                </div>
            ))}
            {remainder > 0 ? (
                <div className="text-muted-foreground">+{String(remainder)} more</div>
            ) : null}
        </div>
    );
}

export async function ComplianceReviewQueuePanel({ authorization }: ComplianceReviewQueuePanelProps) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
    }

    const useCaseDeps: ListPendingReviewComplianceItemsDependencies = {
        complianceItemRepository: new PrismaComplianceItemRepository(),
    };

    const [items, templates] = await Promise.all([
        listPendingReviewComplianceItems(useCaseDeps, { authorization, take: 100 }),
        listComplianceTemplates(
            { complianceTemplateRepository: new PrismaComplianceTemplateRepository() },
            { authorization },
        ),
    ]);

    const templateLookup = buildTemplateItemLookup(templates);

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
                                    <TableHead>Evidence</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead>Completed</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Attachments</TableHead>
                                    <TableHead className="text-right">Review</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => {
                                    const templateMeta = templateLookup.get(item.templateItemId);
                                    const evidence = getEvidenceSummary(item.metadata);
                                    const templateName = templateMeta?.templateName;
                                    const itemName = templateMeta?.item.name ?? item.templateItemId;
                                    const itemType = templateMeta?.item.type;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.userId}</TableCell>
                                            <TableCell className="max-w-72">
                                                <div className="font-medium truncate" title={itemName}>{itemName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {templateName ? `${templateName} - ` : ''}{itemType ?? 'DOCUMENT'}
                                                </div>
                                                {templateMeta?.item.guidanceText ? (
                                                    <div className="text-xs text-muted-foreground truncate" title={templateMeta.item.guidanceText}>
                                                        {templateMeta.item.guidanceText}
                                                    </div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {evidence.length > 0 ? evidence.join(' | ') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={complianceItemStatusBadgeVariant(item.status)}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(item.dueDate)}</TableCell>
                                            <TableCell>{formatDate(item.completedAt)}</TableCell>
                                            <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
                                            <TableCell className="max-w-88 truncate" title={item.notes ?? undefined}>
                                                {item.notes ?? '-'}
                                            </TableCell>
                                            <TableCell className="max-w-88 truncate">
                                                {renderAttachments(item.attachments)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <form action={reviewComplianceItemAction} className="flex flex-col items-end gap-2">
                                                    <input type="hidden" name="userId" value={item.userId} />
                                                    <input type="hidden" name="itemId" value={item.id} />
                                                    <input
                                                        type="hidden"
                                                        name="attachments"
                                                        value={JSON.stringify(item.attachments ?? [])}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name="completedAt"
                                                        value={item.completedAt ? item.completedAt.toISOString() : ''}
                                                    />

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
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
