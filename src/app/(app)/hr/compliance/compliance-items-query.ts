import type { ComplianceLogItem } from '@/server/types/compliance-types';
import { getComplianceItemDetailAction } from './actions/compliance-item-detail';

export const COMPLIANCE_ITEMS_QUERY_KEY = ['hr', 'compliance', 'items'] as const;
const COMPLIANCE_ITEM_SELF_SCOPE = 'self';

export function buildComplianceItemQueryKey(itemId: string, userId?: string) {
    return [...COMPLIANCE_ITEMS_QUERY_KEY, userId ?? COMPLIANCE_ITEM_SELF_SCOPE, itemId] as const;
}

export async function fetchComplianceItemDetail(input: {
    itemId: string;
    userId?: string;
}): Promise<ComplianceLogItem> {
    const result = await getComplianceItemDetailAction(input);
    if (!result.item) {
        throw new Error('Compliance item not found.');
    }
    return result.item;
}
