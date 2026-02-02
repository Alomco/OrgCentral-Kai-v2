import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformToolsRepository } from '@/server/repositories/contracts/platform/admin/platform-tools-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformToolExecution } from '@/server/types/platform/platform-tools';
import { enforcePermission } from '@/server/repositories/security';
import { filterRecordsByTenantScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListPlatformToolExecutionsInput {
    authorization: RepositoryAuthorizationContext;
}

export interface ListPlatformToolExecutionsDependencies {
    toolsRepository: IPlatformToolsRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function listPlatformToolExecutions(
    deps: ListPlatformToolExecutionsDependencies,
    input: ListPlatformToolExecutionsInput,
): Promise<PlatformToolExecution[]> {
    enforcePermission(input.authorization, 'platformTools', 'read');
    const executions = await deps.toolsRepository.listExecutions(input.authorization);
    const scoped = await filterRecordsByTenantScope(
        deps.tenantRepository,
        input.authorization,
        executions,
        (execution) => {
            const tenantId = execution.parameters.tenantId;
            return typeof tenantId === 'string' && tenantId.length > 0 ? tenantId : undefined;
        },
    );

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.tools.executions.list',
        resource: 'platformToolExecution',
        payload: { count: scoped.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return scoped;
}
