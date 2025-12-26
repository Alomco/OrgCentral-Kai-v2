import type { ComplianceCategory } from '@/server/types/compliance-types';
import type {
    ComplianceCategoryUpsertInput,
    IComplianceCategoryRepository,
} from '@/server/repositories/contracts/hr/compliance/compliance-category-repository-contract';
import { assertNonEmpty } from '@/server/use-cases/shared/validators';

export interface UpsertComplianceCategoryInput {
    orgId: string;
    key: string;
    label: string;
    sortOrder?: number;
    metadata?: ComplianceCategoryUpsertInput['metadata'];
}

export interface UpsertComplianceCategoryDependencies {
    complianceCategoryRepository: IComplianceCategoryRepository;
}

export async function upsertComplianceCategory(
    deps: UpsertComplianceCategoryDependencies,
    input: UpsertComplianceCategoryInput,
): Promise<ComplianceCategory> {
    assertNonEmpty(input.orgId, 'orgId');
    assertNonEmpty(input.key, 'key');
    assertNonEmpty(input.label, 'label');

    const normalizedKey = input.key.trim();
    const normalizedLabel = input.label.trim();

    return deps.complianceCategoryRepository.upsertCategory({
        orgId: input.orgId,
        key: normalizedKey,
        label: normalizedLabel,
        sortOrder: input.sortOrder,
        metadata: input.metadata,
    });
}
