import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { ComplianceAssignmentServiceContract } from '@/server/services/hr/compliance/compliance-assignment.service.provider';
import { assertNonEmpty, assertNonEmptyArray } from '@/server/use-cases/shared/validators';
import { invalidateComplianceItemsCache } from './shared/cache-helpers';

export interface AssignComplianceItemsInput {
    authorization: RepositoryAuthorizationContext;
    templateId: string;
    templateItemIds: string[];
    userIds: string[];
}

export interface AssignComplianceItemsDependencies {
    assignmentService: ComplianceAssignmentServiceContract;
}

export async function assignComplianceItems(
    deps: AssignComplianceItemsDependencies,
    input: AssignComplianceItemsInput,
): Promise<void> {
    assertNonEmpty(input.templateId, 'templateId');
    assertNonEmptyArray(input.userIds, 'userIds');
    assertNonEmptyArray(input.templateItemIds, 'templateItemIds');

    await deps.assignmentService.assignCompliancePack({
        authorization: input.authorization,
        templateId: input.templateId,
        templateItemIds: input.templateItemIds,
        userIds: input.userIds,
    });

    await invalidateComplianceItemsCache(input.authorization);
}
