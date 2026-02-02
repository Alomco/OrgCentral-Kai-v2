import { randomUUID } from 'node:crypto';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformToolsRepository } from '@/server/repositories/contracts/platform/admin/platform-tools-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformToolExecution } from '@/server/types/platform/platform-tools';
import { enforcePermission } from '@/server/repositories/security';
import { parsePlatformToolExecute, type PlatformToolExecuteInput } from '@/server/validators/platform/admin/platform-tool-validators';
import { PLATFORM_TOOL_ALLOWLIST } from '@/server/constants/platform-tools';
import { requireBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/require-break-glass';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { checkAdminRateLimit, buildAdminRateLimitKey } from '@/server/lib/security/admin-rate-limit';
import { ValidationError } from '@/server/errors';
import { requireTenantInScope } from '@/server/use-cases/platform/admin/tenants/tenant-scope-guards';

export interface ExecutePlatformToolInput {
    authorization: RepositoryAuthorizationContext;
    request: PlatformToolExecuteInput;
}

export interface ExecutePlatformToolDependencies {
    toolsRepository: IPlatformToolsRepository;
    breakGlassRepository: IBreakGlassRepository;
    tenantRepository: IPlatformTenantRepository;
}

export async function executePlatformTool(
    deps: ExecutePlatformToolDependencies,
    input: ExecutePlatformToolInput,
): Promise<PlatformToolExecution> {
    enforcePermission(input.authorization, 'platformTools', 'execute');

    const request = parsePlatformToolExecute(input.request);
    const tool = PLATFORM_TOOL_ALLOWLIST.get(request.toolId);

    if (!tool) {
        throw new ValidationError('Tool is not in the allowlist.');
    }

    const rate = checkAdminRateLimit(
        buildAdminRateLimitKey({
            orgId: input.authorization.orgId,
            userId: input.authorization.userId,
            action: `tool:${request.toolId}`,
        }),
        5 * 60 * 1000,
        6,
    );

    if (!rate.allowed) {
        throw new ValidationError('Rate limit exceeded for tool execution.');
    }

    if (tool.requiresMfa && !input.authorization.mfaVerified) {
        throw new ValidationError('MFA verification is required to run this tool.');
    }

    const parameters = tool.parameterSchema.parse(request.parameters);
    const tenantId = typeof parameters.tenantId === 'string' ? parameters.tenantId : undefined;
    if (tenantId) {
        await requireTenantInScope(
            deps.tenantRepository,
            input.authorization,
            tenantId,
            'Tenant not found or not within allowed scope for platform tools.',
        );
    }
    if (tool.requiresBreakGlass) {
        await requireBreakGlassApproval(deps.breakGlassRepository, {
            authorization: input.authorization,
            approvalId: request.breakGlassApprovalId,
            scope: 'platform-tools',
            targetOrgId: tenantId ?? input.authorization.orgId,
            action: 'platform-tool.execute',
            resourceId: tool.id,
        });
    }
    const now = new Date();

    const execution: PlatformToolExecution = {
        id: randomUUID(),
        orgId: input.authorization.orgId,
        dataResidency: input.authorization.dataResidency,
        dataClassification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        toolId: tool.id,
        requestedBy: input.authorization.userId,
        status: 'COMPLETED',
        dryRun: request.dryRun,
        parameters,
        output: {
            message: request.dryRun
                ? 'Dry run completed. No changes were applied.'
                : 'Execution queued. Monitor runbook for progress.',
            runbook: tool.runbookUrl,
        },
        createdAt: now.toISOString(),
        completedAt: now.toISOString(),
    };

    await deps.toolsRepository.createExecution(input.authorization, execution);

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'SYSTEM',
        action: 'platform_tool.execute',
        resource: 'platformTool',
        resourceId: tool.id,
        payload: { dryRun: request.dryRun, parameters },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    if (tool.requiresBreakGlass) {
        await requireBreakGlassApproval(deps.breakGlassRepository, {
            authorization: input.authorization,
            approvalId: request.breakGlassApprovalId,
            scope: 'platform-tools',
            targetOrgId: tenantId ?? input.authorization.orgId,
            action: 'platform-tool.execute',
            resourceId: tool.id,
            consume: true,
        });
    }

    return execution;
}
