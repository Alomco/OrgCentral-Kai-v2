import { describe, expect, it } from 'vitest';

import {
    listTenantDocumentsService,
    presignTenantDocumentDownloadService,
} from '@/server/services/platform/admin/document-vault-service';
import { approveBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/approve-break-glass';
import { requestBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/request-break-glass';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';

const baseAuthorization: Omit<RepositoryAuthorizationContext, 'userId' | 'permissions'> = {
    orgId: '00000000-0000-0000-0000-000000000999',
    roleKey: 'globalAdmin',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    tenantScope: {
        orgId: '00000000-0000-0000-0000-000000000999',
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

const tenant: PlatformTenantDetail = {
    id: '00000000-0000-0000-0000-000000000123',
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

const documentRecord: DocumentVaultRecord = {
    id: '00000000-0000-0000-0000-000000000456',
    orgId: tenant.id,
    ownerOrgId: null,
    ownerUserId: null,
    type: 'POLICY',
    classification: 'OFFICIAL',
    retentionPolicy: 'ONE_YEAR',
    retentionExpires: null,
    blobPointer: 'blob://document.pdf',
    checksum: 'checksum',
    mimeType: 'application/pdf',
    sizeBytes: 512,
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

class InMemoryBreakGlassRepository implements IBreakGlassRepository {
    private readonly approvals = new Map<string, BreakGlassApproval>();

    async listApprovals(): Promise<BreakGlassApproval[]> {
        return Array.from(this.approvals.values());
    }

    async getApproval(_: RepositoryAuthorizationContext, approvalId: string): Promise<BreakGlassApproval | null> {
        return this.approvals.get(approvalId) ?? null;
    }

    async createApproval(_: RepositoryAuthorizationContext, approval: BreakGlassApproval): Promise<BreakGlassApproval> {
        this.approvals.set(approval.id, approval);
        return approval;
    }

    async updateApproval(_: RepositoryAuthorizationContext, approval: BreakGlassApproval): Promise<BreakGlassApproval> {
        this.approvals.set(approval.id, approval);
        return approval;
    }
}

class InMemoryTenantRepository implements IPlatformTenantRepository {
    constructor(private readonly tenantRecord: PlatformTenantDetail) {}

    async listTenants(): Promise<never> {
        throw new Error('Not implemented');
    }

    async getTenantDetail(): Promise<PlatformTenantDetail | null> {
        return this.tenantRecord;
    }

    async updateTenantStatus(): Promise<never> {
        throw new Error('Not implemented');
    }

    async getTenantMetrics(): Promise<never> {
        throw new Error('Not implemented');
    }
}

class InMemoryDocumentVaultRepository implements IDocumentVaultRepository {
    constructor(private readonly records: DocumentVaultRecord[]) {}

    async findById(id: string): Promise<DocumentVaultRecord | null> {
        return this.records.find((record) => record.id === id) ?? null;
    }

    async findByBlobPointer(): Promise<DocumentVaultRecord | null> {
        return null;
    }

    async findAll(filters?: { orgId?: string }): Promise<DocumentVaultRecord[]> {
        if (!filters?.orgId) {
            return this.records;
        }
        return this.records.filter((record) => record.orgId === filters.orgId);
    }

    async create(): Promise<DocumentVaultRecord> {
        throw new Error('Not implemented');
    }

    async update(): Promise<DocumentVaultRecord> {
        throw new Error('Not implemented');
    }

    async delete(): Promise<DocumentVaultRecord> {
        throw new Error('Not implemented');
    }
}

describe('document vault admin break-glass flow', () => {
    it('requests, approves, and consumes break-glass for list + download', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);

        const requester: RepositoryAuthorizationContext = {
            ...baseAuthorization,
            userId: '00000000-0000-0000-0000-000000000111',
            permissions: {
                platformBreakGlass: ['request'],
                platformDocuments: ['read', 'download'],
            },
        };

        const approver: RepositoryAuthorizationContext = {
            ...baseAuthorization,
            userId: '00000000-0000-0000-0000-000000000222',
            permissions: {
                platformBreakGlass: ['approve'],
            },
        };

        const listApproval = await requestBreakGlassApproval(
            { breakGlassRepository, tenantRepository },
            {
                authorization: requester,
                request: {
                    scope: 'document-vault',
                    reason: 'Document vault access',
                    targetOrgId: tenant.id,
                    action: 'document-vault.list',
                    resourceId: tenant.id,
                    expiresInMinutes: 30,
                },
            },
        );

        await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: listApproval.approval.id } },
        );

        const documents = await listTenantDocumentsService(
            requester,
            tenant.id,
            listApproval.approval.id,
            undefined,
            { documentVaultRepository, breakGlassRepository, tenantRepository },
        );

        expect(documents).toHaveLength(1);

        const listConsumed = await breakGlassRepository.getApproval(requester, listApproval.approval.id);
        expect(listConsumed?.status).toBe('CONSUMED');

        const downloadApproval = await requestBreakGlassApproval(
            { breakGlassRepository, tenantRepository },
            {
                authorization: requester,
                request: {
                    scope: 'document-vault',
                    reason: 'Document vault access',
                    targetOrgId: tenant.id,
                    action: 'document-vault.download',
                    resourceId: documentRecord.id,
                    expiresInMinutes: 30,
                },
            },
        );

        await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: downloadApproval.approval.id } },
        );

        const download = await presignTenantDocumentDownloadService(
            requester,
            {
                tenantId: tenant.id,
                documentId: documentRecord.id,
                breakGlassApprovalId: downloadApproval.approval.id,
            },
            { documentVaultRepository, breakGlassRepository, tenantRepository },
        );

        expect(download.fileName).toBe(documentRecord.fileName);

        const downloadConsumed = await breakGlassRepository.getApproval(requester, downloadApproval.approval.id);
        expect(downloadConsumed?.status).toBe('CONSUMED');
    });
});
