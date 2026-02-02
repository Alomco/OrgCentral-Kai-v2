import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { PlatformToolDefinition } from '@/server/types/platform/platform-tools';
import { enforcePermission } from '@/server/repositories/security';
import { PLATFORM_TOOL_SPECS } from '@/server/constants/platform-tools';
import { recordAuditEvent } from '@/server/logging/audit-logger';

export interface ListPlatformToolsInput {
    authorization: RepositoryAuthorizationContext;
}

export async function listPlatformTools(input: ListPlatformToolsInput): Promise<PlatformToolDefinition[]> {
    enforcePermission(input.authorization, 'platformTools', 'read');
    const tools = PLATFORM_TOOL_SPECS.map((tool) => ({
        id: tool.id,
        label: tool.label,
        description: tool.description,
        runbookUrl: tool.runbookUrl,
        requiresBreakGlass: tool.requiresBreakGlass,
        requiresMfa: tool.requiresMfa,
    }));

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'ACCESS',
        action: 'platform.tools.list',
        resource: 'platformTool',
        payload: { count: tools.length },
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        auditBatchId: input.authorization.auditBatchId,
    });

    return tools;
}
