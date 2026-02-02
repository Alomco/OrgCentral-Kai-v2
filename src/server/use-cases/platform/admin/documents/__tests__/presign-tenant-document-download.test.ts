import { describe, expect, it, vi } from 'vitest';

import { presignTenantDocumentDownload } from '@/server/use-cases/platform/admin/documents/presign-tenant-document-download';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';

const authorization: RepositoryAuthorizationContext = {
    orgId: '00000000-0000-0000-0000-000000000101',
    userId: '00000000-0000-0000-0000-000000000102',
    roleKey: 'globalAdmin',
    permissions: { documentVault: ['read'], platformBreakGlass: ['read'] },
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    tenantScope: {
        orgId: '00000000-0000-0000-0000-000000000101',
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
    id: '00000000-0000-0000-0000-000000000103',
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

const mockDocument: DocumentVaultRecord = {
    id: '00000000-0000-0000-0000-000000000110',
    orgId: mockTenant.id,
    ownerOrgId: null,
    ownerUserId: null,
    type: 'POLICY',
    classification: 'OFFICIAL',
    retentionPolicy: 'ONE_YEAR',
    retentionExpires: null,
    blobPointer: 'blob://document.pdf',
    checksum: 'checksum',
    mimeType: 'application/pdf',
    sizeBytes: 256,
    fileName: 'document.pdf',
    version: 1,
    latestVersionId: null,
    encrypted: false,
    encryptedKeyRef: null,
    sensitivityLevel: 1,
    dataCategory: null,
    lawfulBasis: null,
    dataSubject: null,
    metadata: null,
    createdAt: new Date(),
};

const mockApproval: BreakGlassApproval = {
    id: '00000000-0000-0000-0000-000000000120',
    orgId: authorization.orgId,
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    requestedBy: authorization.userId,
    approvedBy: '00000000-0000-0000-0000-000000000121',
    reason: 'required',
    scope: 'document-vault',
    status: 'APPROVED',
    targetOrgId: mockTenant.id,
    action: 'document-vault.download',
    resourceId: mockDocument.id,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    consumedAt: null,
    consumedBy: null,
};

const documentVaultRepository: IDocumentVaultRepository = {
    findById: vi.fn().mockResolvedValue(mockDocument),
    findByBlobPointer: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

const breakGlassRepository: IBreakGlassRepository = {
    listApprovals: vi.fn(),
    getApproval: vi.fn().mockResolvedValue(mockApproval),
    createApproval: vi.fn(),
    updateApproval: vi.fn().mockResolvedValue({
        ...mockApproval,
        status: 'CONSUMED',
        consumedAt: new Date().toISOString(),
        consumedBy: authorization.userId,
    }),
};

const tenantRepository: IPlatformTenantRepository = {
    listTenants: vi.fn(),
    getTenantDetail: vi.fn().mockResolvedValue(mockTenant),
    updateTenantStatus: vi.fn(),
    getTenantMetrics: vi.fn(),
};

describe('presignTenantDocumentDownload', () => {
    it('consumes break-glass approval on successful download', async () => {
        const result = await presignTenantDocumentDownload(
            { documentVaultRepository, breakGlassRepository, tenantRepository },
            {
                authorization,
                tenantId: mockTenant.id,
                documentId: mockDocument.id,
                breakGlassApprovalId: mockApproval.id,
            },
        );

        expect(result.downloadUrl).toBe(mockDocument.blobPointer);
        expect(result.fileName).toBe(mockDocument.fileName);
        expect(breakGlassRepository.updateApproval).toHaveBeenCalledWith(
            authorization,
            expect.objectContaining({
                id: mockApproval.id,
                status: 'CONSUMED',
                consumedBy: authorization.userId,
            }),
        );
    });
});
