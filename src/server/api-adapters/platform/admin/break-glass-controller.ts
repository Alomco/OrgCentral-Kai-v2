import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import {
    requestBreakGlassService,
    approveBreakGlassService,
    listBreakGlassApprovalsService,
} from '@/server/services/platform/admin/break-glass-service';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import { parseBreakGlassRequest, parseBreakGlassApprove, parseBreakGlassListQuery } from '@/server/validators/platform/admin/break-glass-validators';

interface BreakGlassListResponse {
    success: true;
    data: BreakGlassApproval[];
}

interface BreakGlassResponse {
    success: true;
    data: BreakGlassApproval;
}

export async function listBreakGlassApprovalsController(request: Request): Promise<BreakGlassListResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBreakGlass: ['read'] },
        auditSource: 'api:platform:break-glass:list',
        action: 'list',
        resourceType: 'breakGlassApproval',
    });

    const url = new URL(request.url);
    const filters = parseBreakGlassListQuery({
        scope: url.searchParams.get('scope') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
    });

    const data = await listBreakGlassApprovalsService(authorization, filters);

    return { success: true, data };
}

export async function requestBreakGlassController(request: Request): Promise<BreakGlassResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBreakGlass: ['request'] },
        auditSource: 'api:platform:break-glass:request',
        action: 'request',
        resourceType: 'breakGlassApproval',
    });

    const payload = parseBreakGlassRequest(await request.json());
    const data = await requestBreakGlassService(authorization, payload);
    return { success: true, data };
}

export async function approveBreakGlassController(request: Request): Promise<BreakGlassResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformBreakGlass: ['approve'] },
        auditSource: 'api:platform:break-glass:approve',
        action: 'approve',
        resourceType: 'breakGlassApproval',
    });

    const payload = parseBreakGlassApprove(await request.json());
    const data = await approveBreakGlassService(authorization, payload);
    return { success: true, data };
}
