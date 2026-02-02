import { describe, expect, it, vi } from 'vitest';

import { executePlatformTool } from '@/server/use-cases/platform/admin/tools/execute-platform-tool';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IPlatformToolsRepository } from '@/server/repositories/contracts/platform/admin/platform-tools-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { PlatformToolExecution } from '@/server/types/platform/platform-tools';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';

const authorization: RepositoryAuthorizationContext = {
    orgId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    roleKey: 'globalAdmin',
    permissions: { platformTools: ['execute'], platformBreakGlass: ['read'] },
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    tenantScope: {
        orgId: '00000000-0000-0000-0000-000000000001',
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

const mockExecution: PlatformToolExecution = {
    id: '00000000-0000-0000-0000-000000000099',
    orgId: '00000000-0000-0000-0000-000000000001',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    toolId: 'sync-billing-status',
    requestedBy: '00000000-0000-0000-0000-000000000002',
    status: 'COMPLETED',
    dryRun: true,
    parameters: {},
    output: null,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
};

const toolsRepository: IPlatformToolsRepository = {
    listExecutions: vi.fn().mockResolvedValue([]),
    createExecution: vi.fn().mockResolvedValue(mockExecution),
    updateExecution: vi.fn().mockResolvedValue(mockExecution),
};

const mockApproval: BreakGlassApproval = {
    id: '00000000-0000-0000-0000-000000000055',
    orgId: '00000000-0000-0000-0000-000000000001',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    requestedBy: '00000000-0000-0000-0000-000000000002',
    approvedBy: '00000000-0000-0000-0000-000000000003',
    reason: 'needed for test',
    scope: 'platform-tools',
    status: 'APPROVED',
    targetOrgId: authorization.orgId,
    action: 'platform-tool.execute',
    resourceId: 'sync-billing-status',
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

const mockTenant: PlatformTenantDetail = {
    id: authorization.orgId,
    name: 'Platform Org',
    slug: 'platform-org',
    status: 'ACTIVE',
    complianceTier: 'STANDARD',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    regionCode: 'UK',
    ownerEmail: 'admin@example.com',
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

describe('executePlatformTool', () => {
    it('requires break-glass for restricted tools', async () => {
        await expect(
            executePlatformTool(
                { toolsRepository, breakGlassRepository, tenantRepository },
                {
                    authorization,
                    request: { toolId: 'sync-billing-status', dryRun: true, parameters: {} },
                },
            ),
        ).rejects.toThrow('Break-glass approval is required');
    });
});
