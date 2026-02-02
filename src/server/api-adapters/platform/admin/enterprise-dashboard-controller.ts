import { authorizePlatformRequest } from '@/server/api-adapters/platform/admin/authorize-platform-request';
import { getEnterpriseDashboardService } from '@/server/services/platform/admin/enterprise-dashboard-service';
import type { EnterpriseDashboardSummary } from '@/server/types/platform/enterprise-dashboard';

interface EnterpriseDashboardResponse {
    success: true;
    data: EnterpriseDashboardSummary;
}

export async function getEnterpriseDashboardController(request: Request): Promise<EnterpriseDashboardResponse> {
    const authorization = await authorizePlatformRequest(request, {
        requiredPermissions: { platformTenants: ['read'] },
        auditSource: 'api:platform:enterprise:dashboard',
        action: 'read',
        resourceType: 'enterpriseDashboard',
    });

    const data = await getEnterpriseDashboardService(authorization);
    return { success: true, data };
}
