import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import { listPlatformTenantsService, getPlatformTenantDetailService, updatePlatformTenantStatusService } from '@/server/services/platform/admin/tenant-management-service';
import type { PlatformTenantDetail, PlatformTenantListResult } from '@/server/types/platform/tenant-admin';
import { parseTenantListQuery, parseTenantStatusAction } from '@/server/validators/platform/admin/tenant-validators';

interface TenantListResponse {
    success: true;
    data: PlatformTenantListResult;
}

interface TenantDetailResponse {
    success: true;
    data: PlatformTenantDetail;
}

export async function listTenantsController(request: Request): Promise<TenantListResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTenants: ['read'] },
        auditSource: 'api:platform:tenants:list',
        action: 'list',
        resourceType: 'platformTenant',
    });

    const url = new URL(request.url);
    const query = parseTenantListQuery(buildTenantQuery(url.searchParams));

    const data = await listPlatformTenantsService(authorization, query);
    return { success: true, data };
}

export async function getTenantDetailController(
    request: Request,
    tenantId: string,
): Promise<TenantDetailResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTenants: ['read'] },
        auditSource: 'api:platform:tenants:detail',
        action: 'read',
        resourceType: 'platformTenant',
    });

    const data = await getPlatformTenantDetailService(authorization, tenantId);
    return { success: true, data };
}

export async function updateTenantStatusController(
    request: Request,
): Promise<TenantDetailResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTenants: ['update'] },
        auditSource: 'api:platform:tenants:update',
        action: 'update',
        resourceType: 'platformTenant',
    });

    const payload = parseTenantStatusAction(await request.json());
    const data = await updatePlatformTenantStatusService(authorization, payload);
    return { success: true, data };
}

function buildTenantQuery(params: URLSearchParams): Record<string, unknown> {
    const query = params.get('q') ?? undefined;
    const status = params.getAll('status');
    const complianceTier = params.getAll('tier');
    const classification = params.getAll('classification');
    const residency = params.getAll('residency');
    const page = params.get('page');
    const pageSize = params.get('pageSize');

    return {
        ...(query ? { query } : {}),
        ...(status.length ? { status } : {}),
        ...(complianceTier.length ? { complianceTier } : {}),
        ...(classification.length ? { classification } : {}),
        ...(residency.length ? { residency } : {}),
        ...(page ? { page: Number(page) } : {}),
        ...(pageSize ? { pageSize: Number(pageSize) } : {}),
    };
}
