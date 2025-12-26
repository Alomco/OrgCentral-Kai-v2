import type { ComplianceLogItem } from '@/server/types/compliance-types';
import type { IComplianceItemRepository } from '@/server/repositories/contracts/hr/compliance/compliance-item-repository-contract';
import type { IComplianceCategoryRepository } from '@/server/repositories/contracts/hr/compliance/compliance-category-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';
import { registerComplianceItemsCache } from './shared/cache-helpers';

const UNCATEGORIZED_KEY = '__uncategorized__';

export interface ComplianceItemsGroup {
    categoryKey: string;
    categoryLabel: string;
    sortOrder: number;
    items: ComplianceLogItem[];
}

export interface ListComplianceItemsGroupedInput {
    authorization: RepositoryAuthorizationContext;
    userId: string;
    uncategorizedLabel?: string;
}

export interface ListComplianceItemsGroupedDependencies {
    complianceItemRepository: IComplianceItemRepository;
    complianceCategoryRepository?: IComplianceCategoryRepository;
}

export async function listComplianceItemsGrouped(
    deps: ListComplianceItemsGroupedDependencies,
    input: ListComplianceItemsGroupedInput,
): Promise<ComplianceItemsGroup[]> {
    assertNonEmpty(input.userId, 'userId');
    registerComplianceItemsCache(input.authorization);

    const items = await deps.complianceItemRepository.listItemsForUser(input.authorization.orgId, input.userId);
    const uncategorizedLabel = input.uncategorizedLabel ?? 'General';

    const categories = deps.complianceCategoryRepository
        ? await deps.complianceCategoryRepository.listCategories(input.authorization.orgId)
        : [];
    const categoryByKey = new Map(categories.map((category) => [category.key, category] as const));

    const grouped = new Map<string, ComplianceLogItem[]>();
    for (const item of items) {
        const trimmedKey = item.categoryKey?.trim();
        const key = trimmedKey && trimmedKey.length > 0 ? trimmedKey : UNCATEGORIZED_KEY;
        const bucket = grouped.get(key);
        if (bucket) {
            bucket.push(item);
        } else {
            grouped.set(key, [item]);
        }
    }

    return [...grouped.entries()]
        .map(([categoryKey, bucket]) => {
            if (categoryKey === UNCATEGORIZED_KEY) {
                return { categoryKey, categoryLabel: uncategorizedLabel, sortOrder: 9999, items: bucket };
            }

            const category = categoryByKey.get(categoryKey);
            return {
                categoryKey,
                categoryLabel: category?.label ?? categoryKey,
                sortOrder: category?.sortOrder ?? 5000,
                items: bucket,
            };
        })
        .sort((a, b) => a.sortOrder - b.sortOrder || a.categoryLabel.localeCompare(b.categoryLabel));
}
