'use client';

import { useQuery } from '@tanstack/react-query';

import type { ComplianceLogItem, ComplianceTemplateItem } from '@/server/types/compliance-types';
import { buildComplianceItemQueryKey, fetchComplianceItemDetail } from '../compliance-items-query';
import { getStatusDetails } from './compliance-item-utils';
import {
    ComplianceItemActivityCard,
    ComplianceItemAssignmentCard,
    ComplianceItemDetailsCard,
    ComplianceItemEvidenceCard,
} from './compliance-item-sections';

interface ComplianceItemDetailCardsProps {
    itemId: string;
    userId: string;
    initialItem: ComplianceLogItem;
    categoryLabel: string;
    itemType: string;
    assignedName: string;
    templateItem: ComplianceTemplateItem | null;
    canEdit: boolean;
}

export function ComplianceItemDetailCards({
    itemId,
    userId,
    initialItem,
    categoryLabel,
    itemType,
    assignedName,
    templateItem,
    canEdit,
}: ComplianceItemDetailCardsProps) {
    const { data } = useQuery({
        queryKey: buildComplianceItemQueryKey(itemId, userId),
        queryFn: () => fetchComplianceItemDetail({ itemId, userId }),
        initialData: initialItem,
    });

    const item = data;
    const statusDetails = getStatusDetails(item.status);

    return (
        <>
            <ComplianceItemDetailsCard
                categoryLabel={categoryLabel}
                statusLabel={statusDetails.label}
                itemType={itemType}
                dueDate={item.dueDate}
                createdAt={item.createdAt}
                completedAt={item.completedAt}
            />
            <ComplianceItemAssignmentCard
                assignedName={assignedName}
                userId={item.userId}
            />
            <ComplianceItemEvidenceCard
                complianceItem={item}
                templateItem={templateItem}
                canEdit={canEdit}
            />
            <ComplianceItemActivityCard
                createdAt={item.createdAt}
                completedAt={item.completedAt}
            />
        </>
    );
}
