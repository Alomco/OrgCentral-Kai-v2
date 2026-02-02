import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import {
    listPlatformToolsService,
    listPlatformToolExecutionsService,
    executePlatformToolService,
} from '@/server/services/platform/admin/platform-tools-service';
import type { PlatformToolDefinition, PlatformToolExecution } from '@/server/types/platform/platform-tools';
import { parsePlatformToolExecute } from '@/server/validators/platform/admin/platform-tool-validators';

interface PlatformToolsResponse {
    success: true;
    data: PlatformToolDefinition[];
}

interface PlatformToolExecutionsResponse {
    success: true;
    data: PlatformToolExecution[];
}

interface PlatformToolExecutionResponse {
    success: true;
    data: PlatformToolExecution;
}

export async function listPlatformToolsController(request: Request): Promise<PlatformToolsResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTools: ['read'] },
        auditSource: 'api:platform:tools:list',
        action: 'list',
        resourceType: 'platformTool',
    });

    const data = await listPlatformToolsService(authorization);
    return { success: true, data };
}

export async function listPlatformToolExecutionsController(request: Request): Promise<PlatformToolExecutionsResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTools: ['read'] },
        auditSource: 'api:platform:tools:executions:list',
        action: 'list',
        resourceType: 'platformToolExecution',
    });

    const data = await listPlatformToolExecutionsService(authorization);
    return { success: true, data };
}

export async function executePlatformToolController(request: Request): Promise<PlatformToolExecutionResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTools: ['execute'] },
        auditSource: 'api:platform:tools:execute',
        action: 'execute',
        resourceType: 'platformToolExecution',
    });

    const payload = parsePlatformToolExecute(await request.json());
    const data = await executePlatformToolService(authorization, payload);
    return { success: true, data };
}
