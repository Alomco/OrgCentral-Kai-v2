import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { PrismaComplianceCategoryRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-category-repository';
import { PrismaComplianceItemRepository } from '@/server/repositories/prisma/hr/compliance/prisma-compliance-item-repository';
import {
    listComplianceItemsGrouped,
    type ListComplianceItemsGroupedDependencies,
} from '@/server/use-cases/hr/compliance/list-compliance-items-grouped';

import { formatHumanDate } from '../../_components/format-date';
import { complianceItemStatusBadgeVariant } from '../../_components/hr-badge-variants';

export interface ComplianceItemsPanelProps {
    authorization: RepositoryAuthorizationContext;
    userId: string;
}

function formatDate(value: Date | null | undefined): string {
    if (!value) {
        return '—';
    }
    return formatHumanDate(value);
}

export async function ComplianceItemsPanel({ authorization, userId }: ComplianceItemsPanelProps) {
    const useCaseDeps: ListComplianceItemsGroupedDependencies = {
        complianceItemRepository: new PrismaComplianceItemRepository(),
        complianceCategoryRepository: new PrismaComplianceCategoryRepository(),
    };

    const groups = await listComplianceItemsGrouped(useCaseDeps, { authorization, userId });
    const totalItems = groups.reduce((accumulator, group) => accumulator + group.items.length, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your compliance items</CardTitle>
                <CardDescription>Assigned items and their current status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {totalItems === 0 ? (
                    <div className="text-sm text-muted-foreground">No compliance items assigned yet.</div>
                ) : (
                    groups.map((group) => (
                        <div key={group.categoryKey} className="space-y-2">
                            <div className="text-sm font-medium">{group.categoryLabel}</div>
                            <div className="overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due</TableHead>
                                            <TableHead>Completed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.templateItemId}</TableCell>
                                                <TableCell>
                                                    <Badge variant={complianceItemStatusBadgeVariant(item.status)}>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(item.dueDate)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(item.completedAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
