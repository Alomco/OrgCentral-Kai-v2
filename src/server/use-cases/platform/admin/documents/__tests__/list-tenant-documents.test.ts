import { describe, expect, it, vi } from 'vitest';

import { listTenantDocuments } from '@/server/use-cases/platform/admin/documents/list-tenant-documents';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';

const authorization: RepositoryAuthorizationContext = {
    orgId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    roleKey: 'globalAdmin',
    permissions: { documentVault: ['read'], platformBreakGlass: ['read'] },
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

const mockTenant: PlatformTenantDetail = {
    id: '00000000-0000-0000-0000-000000000009',
    name: 'Tenant',
    slug: 'tenant',
    status: 'ACTIVE',
    complianceTier: 'STANDARD',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    regionCode: 'UK',
    ownerEmail: 'owner@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscription: null,
    governanceTags: null,
    securityControls: null,
};

const documentVaultRepository: IDocumentVaultRepository = {
    findById: vi.fn(),
    findByBlobPointer: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const breakGlassRepository: IBreakGlassRepository = {
    listApprovals: vi.fn(),
    getApproval: vi.fn(),
    createApproval: vi.fn(),
    updateApproval: vi.fn(),
};

const tenantRepository: IPlatformTenantRepository = {
    listTenants: vi.fn(),
    getTenantDetail: vi.fn().mockResolvedValue(mockTenant),
    updateTenantStatus: vi.fn(),
    getTenantMetrics: vi.fn(),
};

describe('listTenantDocuments', () => {
    it('requires break-glass approval to list documents', async () => {
        await expect(
            listTenantDocuments(
                { documentVaultRepository, breakGlassRepository, tenantRepository },
                {
                    authorization,
                    tenantId: mockTenant.id,
                    breakGlassApprovalId: '',
                },
            ),
        ).rejects.toThrow('Break-glass approval is required for this operation.');
    });
});
