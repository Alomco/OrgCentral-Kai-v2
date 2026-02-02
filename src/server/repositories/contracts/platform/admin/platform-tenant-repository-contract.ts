import type { OrganizationStatus, ComplianceTier, DataClassificationLevel, DataResidencyZone } from '@/server/types/prisma';
import type { PlatformTenantDetail, PlatformTenantListResult } from '@/server/types/platform/tenant-admin';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';

export interface PlatformTenantListQuery {
    query?: string;
    status?: OrganizationStatus[];
    complianceTier?: ComplianceTier[];
    classification?: DataClassificationLevel[];
    residency?: DataResidencyZone[];
    page: number;
    pageSize: number;
}

export interface PlatformTenantMetrics {
    total: number;
    active: number;
    suspended: number;
    decommissioned: number;
}

export interface IPlatformTenantRepository {
    listTenants(
        context: RepositoryAuthorizationContext,
        query: PlatformTenantListQuery,
    ): Promise<PlatformTenantListResult>;

    getTenantDetail(
        context: RepositoryAuthorizationContext,
        tenantId: string,
    ): Promise<PlatformTenantDetail | null>;

    updateTenantStatus(
        context: RepositoryAuthorizationContext,
        tenantId: string,
        status: OrganizationStatus,
    ): Promise<PlatformTenantDetail>;

    getTenantMetrics(context: RepositoryAuthorizationContext): Promise<PlatformTenantMetrics>;
}
