import { describe, expect, it, vi } from 'vitest';

import { updatePlatformTenantStatus } from '@/server/use-cases/platform/admin/tenants/update-platform-tenant-status';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';

const authorization: RepositoryAuthorizationContext = {
    orgId: '00000000-0000-0000-0000-000000000010',
    userId: '00000000-0000-0000-0000-000000000011',
    roleKey: 'globalAdmin',
    permissions: { platformTenants: ['update'] },
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    tenantScope: {
        orgId: '00000000-0000-0000-0000-000000000010',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
    },
    auditBatchId: undefined,
    mfaVerified: true,
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    authenticatedAt: new Date(),
    sessionExpiresAt: new Date(Date.now() + 1000 * 60),
    lastActivityAt: new Date(),
    sessionId: 'session',
    sessionToken: 'token',
    authorizedAt: new Date(),
    authorizationReason: 'test',
};

const mockTenant: PlatformTenantDetail = {
    id: '00000000-0000-0000-0000-000000000020',
    name: 'Acme',
    slug: 'acme',
    status: 'ACTIVE',
    complianceTier: 'STANDARD',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    regionCode: 'UK',
    ownerEmail: 'owner@acme.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscription: null,
    governanceTags: null,
    securityControls: null,
};

const tenantRepository: IPlatformTenantRepository = {
    listTenants: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
    getTenantDetail: vi.fn().mockResolvedValue(mockTenant),
    updateTenantStatus: vi.fn().mockResolvedValue(mockTenant),
    getTenantMetrics: vi.fn().mockResolvedValue({ total: 0, active: 0, suspended: 0, decommissioned: 0 }),
};

const mockApproval: BreakGlassApproval = {
    id: '00000000-0000-0000-0000-000000000030',
    orgId: authorization.orgId,
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    requestedBy: authorization.userId,
    approvedBy: '00000000-0000-0000-0000-000000000031',
    reason: 'required',
    scope: 'tenant-status',
    status: 'APPROVED',
    targetOrgId: mockTenant.id,
    action: 'tenant.suspend',
    resourceId: mockTenant.id,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    consumedAt: null,
    consumedBy: null,
};

const breakGlassRepository: IBreakGlassRepository = {
    listApprovals: vi.fn().mockResolvedValue([mockApproval]),
    getApproval: vi.fn().mockResolvedValue(null),
    createApproval: vi.fn().mockResolvedValue(mockApproval),
    updateApproval: vi.fn().mockResolvedValue(mockApproval),
};

describe('updatePlatformTenantStatus', () => {
    it('requires break-glass approval when suspending a tenant', async () => {
        await expect(
            updatePlatformTenantStatus(
                { tenantRepository, breakGlassRepository },
                {
                    authorization,
                    request: { tenantId: mockTenant.id, action: 'SUSPEND' },
                },
            ),
        ).rejects.toThrow('Break-glass approval is required');
    });
});
