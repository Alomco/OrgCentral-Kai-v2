import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/theme/elements';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaComplianceCategoryRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-category-repository';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import { PrismaComplianceTemplateRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-template-repository';
import {
    listComplianceItemsGrouped,
    type ListComplianceItemsGroupedDependencies,
} from '@/server/use-cases/hr/compliance/list-compliance-items-grouped';
import { listComplianceTemplates } from '@/server/use-cases/hr/compliance/list-compliance-templates';

import { formatHumanDate } from '../../_components/format-date';
import { complianceItemStatusBadgeVariant } from '../../_components/hr-badge-variants';
import { buildTemplateItemLookup } from './compliance-template-lookup';

export interface ComplianceItemsPanelProps {
    authorization: RepositoryAuthorizationContext;
    userId: string;
    title?: string;
    description?: string;
}

function formatDate(value: Date | null | undefined): string {
    if (!value) {
        return '—';
    }
    return formatHumanDate(value);
}

function formatItemType(type?: string): string {
    if (!type) {
        return 'Requirement';
    }
    switch (type) {
        case 'DOCUMENT':
            return 'Document upload';
        case 'COMPLETION_DATE':
            return 'Completion date';
        case 'YES_NO':
            return 'Yes / No confirmation';
        case 'ACKNOWLEDGEMENT':
            return 'Acknowledgement';
        default:
            return 'Requirement';
    }
}

function formatStatusLabel(status: string): string {
    switch (status) {
        case 'PENDING':
            return 'Needs action';
        case 'COMPLETE':
            return 'Completed';
        case 'MISSING':
            return 'Missing info';
        case 'PENDING_REVIEW':
            return 'Awaiting review';
        case 'NOT_APPLICABLE':
            return 'Not required';
        case 'EXPIRED':
            return 'Expired';
        default:
            return status;
    }
}

export async function ComplianceItemsPanel({
    authorization,
    userId,
    title,
    description,
}: ComplianceItemsPanelProps) {
    if (authorization.dataClassification !== 'OFFICIAL') {
        noStore();
    }

    const useCaseDeps: ListComplianceItemsGroupedDependencies = {
        complianceItemRepository: new PrismaComplianceItemRepository(),
        complianceCategoryRepository: new PrismaComplianceCategoryRepository(),
    };

    const [groups, templates] = await Promise.all([
        listComplianceItemsGrouped(useCaseDeps, { authorization, userId }),
        listComplianceTemplates(
            { complianceTemplateRepository: new PrismaComplianceTemplateRepository() },
            { authorization },
        ),
    ]);

    const templateLookup = buildTemplateItemLookup(templates);

    const filteredGroups = groups
        .map((group) => {
            const items = group.items.filter((item) => {
                const template = templateLookup.get(item.templateItemId);
                return !template?.item.isInternalOnly;
            });
            return { ...group, items };
        })
        .filter((group) => group.items.length > 0);

    const totalItems = filteredGroups.reduce((accumulator, group) => accumulator + group.items.length, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title ?? 'Your compliance items'}</CardTitle>
                <CardDescription>
                    {description ?? 'See what needs your attention and when it’s due.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {totalItems === 0 ? (
                    <EmptyState
                        title="You’re all set"
                        description="There are no compliance items assigned to you right now. If something looks missing, contact your admin."
                        className="rounded-lg border border-dashed border-border/60 bg-muted/30"
                    />
                ) : (
                    filteredGroups.map((group) => (
                        <div key={group.categoryKey} className="space-y-2">
                            <div className="text-sm font-medium">{group.categoryLabel}</div>
                            <div className="overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>What to do</TableHead>
                                            <TableHead>Requirement</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due date</TableHead>
                                            <TableHead>Completed on</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((item) => {
                                            const templateMeta = templateLookup.get(item.templateItemId);
                                            const itemName = templateMeta?.item.name ?? item.templateItemId;
                                            const guidance = templateMeta?.item.guidanceText;
                                            const itemType = templateMeta?.item.type ?? 'DOCUMENT';

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium max-w-[360px] min-w-0">
                                                        <Link
                                                            href={`/hr/compliance/${item.id}`}
                                                            className="block truncate hover:underline"
                                                        >
                                                            {itemName}
                                                        </Link>
                                                        {guidance ? (
                                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                                {guidance}
                                                            </div>
                                                        ) : null}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {formatItemType(itemType)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={complianceItemStatusBadgeVariant(item.status)}>
                                                            {formatStatusLabel(item.status)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatDate(item.dueDate)}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(item.completedAt)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
