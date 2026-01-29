'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ComplianceLogItem } from '@/server/types/compliance-types';

import { buildComplianceItemQueryKey, fetchComplianceItemDetail } from '../compliance-items-query';
import { getStatusDetails } from './compliance-item-utils';

interface ComplianceItemDetailHeaderProps {
    itemId: string;
    userId: string;
    initialItem: ComplianceLogItem;
    itemTitle: string;
    itemGuidance?: string;
    isInternalOnly: boolean;
}

export function ComplianceItemDetailHeader({
    itemId,
    userId,
    initialItem,
    itemTitle,
    itemGuidance,
    isInternalOnly,
}: ComplianceItemDetailHeaderProps) {
    const { data } = useQuery({
        queryKey: buildComplianceItemQueryKey(itemId, userId),
        queryFn: () => fetchComplianceItemDetail({ itemId, userId }),
        initialData: initialItem,
    });

    const statusDetails = useMemo(
        () => getStatusDetails(data.status),
        [data.status],
    );
    const StatusIcon = statusDetails.icon;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle>{itemTitle}</CardTitle>
                            <Badge variant={statusDetails.variant}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusDetails.label}
                            </Badge>
                            {isInternalOnly ? (
                                <Badge variant="outline">Internal only</Badge>
                            ) : null}
                        </div>
                        <CardDescription>{itemGuidance ?? 'Compliance item details and evidence.'}</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
