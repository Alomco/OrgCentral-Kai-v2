import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import type { BreakGlassApproval } from '@/server/types/platform/break-glass';
import type { IBreakGlassRepository } from '@/server/repositories/contracts/platform/admin/break-glass-repository-contract';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';

const baseAuthorization: Omit<RepositoryAuthorizationContext, 'userId' | 'permissions'> = {
    orgId: '11111111-1111-4111-8111-111111111111',
    roleKey: 'globalAdmin',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    tenantScope: {
        orgId: '11111111-1111-4111-8111-111111111111',
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

export const tenant: PlatformTenantDetail = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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

export const documentRecord: DocumentVaultRecord = {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
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

export function buildAuthorization(
    userId: string,
    permissions: RepositoryAuthorizationContext['permissions'],
): RepositoryAuthorizationContext {
    return {
        ...baseAuthorization,
        userId,
        permissions,
    };
}

export class InMemoryBreakGlassRepository implements IBreakGlassRepository {
    private readonly approvals = new Map<string, BreakGlassApproval>();

    async listApprovals(): Promise<BreakGlassApproval[]> {
        return Array.from(this.approvals.values());
    }

    async getApproval(
        _: RepositoryAuthorizationContext,
        approvalId: string,
    ): Promise<BreakGlassApproval | null> {
        return this.approvals.get(approvalId) ?? null;
    }

    async createApproval(
        _: RepositoryAuthorizationContext,
        approval: BreakGlassApproval,
    ): Promise<BreakGlassApproval> {
        this.approvals.set(approval.id, approval);
        return approval;
    }

    async updateApproval(
        _: RepositoryAuthorizationContext,
        approval: BreakGlassApproval,
    ): Promise<BreakGlassApproval> {
        this.approvals.set(approval.id, approval);
        return approval;
    }
}

export class InMemoryTenantRepository implements IPlatformTenantRepository {
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

export class InMemoryDocumentVaultRepository implements IDocumentVaultRepository {
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
