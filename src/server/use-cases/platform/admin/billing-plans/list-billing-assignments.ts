import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IBillingPlanRepository } from '@/server/repositories/contracts/platform/admin/billing-plan-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { BillingPlanAssignment } from '@/server/types/platform/billing-plan';
import { enforcePermission } from '@/server/repositories/security';
import { filterRecordsByTenantScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListBillingAssignmentsInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListBillingAssignmentsDependencies {
    billingPlanRepository: IBillingPlanRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function listBillingAssignments(
    deps: ListBillingAssignmentsDependencies,
    input: ListBillingAssignmentsInput,
): Promise<BillingPlanAssignment[]> {
    enforcePermission(input.authorization, 'platformBillingPlans', 'read');
    const assignments = await deps.billingPlanRepository.listAssignments(input.authorization);
    const scoped = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        assignments,
        (assignment) => assignment.tenantId,
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.billing.assignments.list',
        resource: 'platformBillingAssignment',
        payload: { count: scoped.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return scoped;
}
