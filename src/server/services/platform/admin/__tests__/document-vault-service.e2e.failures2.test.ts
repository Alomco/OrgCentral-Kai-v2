import { describe, expect, it, vi } from 'vitest';

import {
    listTenantDocumentsService,
    presignTenantDocumentDownloadService,
} from '@/server/services/platform/admin/document-vault-service';
import { approveBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/approve-break-glass';
import { requestBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/request-break-glass';
import type { IPlatformTenantRepository } from '@/server/repositories/contracts/platform/admin/platform-tenant-repository-contract';
import type { PlatformTenantDetail } from '@/server/types/platform/tenant-admin';
import type { RepositoryAuthorizationContext } from '@/server/types/repository-authorization';
import {
    buildAuthorization,
    documentRecord,
    InMemoryBreakGlassRepository,
    InMemoryDocumentVaultRepository,
    InMemoryTenantRepository,
    tenant,
} from './document-vault-service.e2e.fixtures';

vi.mock('@/server/services/security/security-event-service.provider', () => ({
    getSecurityEventService: () => ({
        logSecurityEvent: vi.fn().mockResolvedValue(undefined),
        getSecurityEvent: vi.fn().mockResolvedValue(undefined),
        getSecurityEventsByOrg: vi.fn().mockResolvedValue([]),
        countSecurityEventsByOrg: vi.fn().mockResolvedValue(0),
    }),
}));

class MultiTenantRepository implements IPlatformTenantRepository {
    constructor(private readonly records: PlatformTenantDetail[]) {}

    async listTenants(): Promise<never> {
        throw new Error('Not implemented');
    }

    async getTenantDetail(
        _: RepositoryAuthorizationContext,
        tenantId: string,
    ): Promise<PlatformTenantDetail | null> {
        return this.records.find((record) => record.id === tenantId) ?? null;
    }

    async updateTenantStatus(): Promise<never> {
        throw new Error('Not implemented');
    }

    async getTenantMetrics(): Promise<never> {
        throw new Error('Not implemented');
    }
}

describe('document vault admin break-glass additional failures', () => {
    it('rejects list requests when approval is pending', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('10101010-1010-4101-8101-101010101010', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read'],
        });

        const approval = await requestBreakGlassApproval(
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

        await expect(
            listTenantDocumentsService(
                requester,
                tenant.id,
                approval.approval.id,
                undefined,
                { documentVaultRepository, breakGlassRepository, tenantRepository },
            ),
        ).rejects.toThrow('Break-glass approval is not approved.');
    });

    it('rejects list requests when approval target tenant mismatches', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const otherTenant: PlatformTenantDetail = {
            ...tenant,
            id: 'bbbbbbbb-cccc-4bbb-8ccc-bbbbbbbbbbbb',
            slug: 'other-tenant',
            name: 'Other tenant',
        };
        const tenantRepository = new MultiTenantRepository([tenant, otherTenant]);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('20202020-2020-4202-8202-202020202020', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read'],
        });
        const approver = buildAuthorization('30303030-3030-4303-8303-303030303030', {
            platformBreakGlass: ['approve'],
        });

        const approval = await requestBreakGlassApproval(
            { breakGlassRepository, tenantRepository },
            {
                authorization: requester,
                request: {
                    scope: 'document-vault',
                    reason: 'Document vault access',
                    targetOrgId: otherTenant.id,
                    action: 'document-vault.list',
                    resourceId: otherTenant.id,
                    expiresInMinutes: 30,
                },
            },
        );

        await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: approval.approval.id } },
        );

        await expect(
            listTenantDocumentsService(
                requester,
                tenant.id,
                approval.approval.id,
                undefined,
                { documentVaultRepository, breakGlassRepository, tenantRepository },
            ),
        ).rejects.toThrow('Break-glass approval target tenant mismatch.');
    });

    it('rejects list requests when approval residency differs from authorization', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('40404040-4040-4404-8404-404040404040', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read'],
        });
        const approver = buildAuthorization('50505050-5050-4505-8505-505050505050', {
            platformBreakGlass: ['approve'],
        });

        const approval = await requestBreakGlassApproval(
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

        const approved = await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: approval.approval.id } },
        );

        await breakGlassRepository.updateApproval(requester, {
            ...approved.approval,
            dataResidency: 'GLOBAL_RESTRICTED',
        });

        await expect(
            listTenantDocumentsService(
                requester,
                tenant.id,
                approval.approval.id,
                undefined,
                { documentVaultRepository, breakGlassRepository, tenantRepository },
            ),
        ).rejects.toThrow('Break-glass approval is outside current data scope.');
    });

    it('rejects downloads when approval classification differs from authorization', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('60606060-6060-4606-8606-606060606060', {
            platformBreakGlass: ['request'],
            platformDocuments: ['download'],
        });
        const approver = buildAuthorization('70707070-7070-4707-8707-707070707070', {
            platformBreakGlass: ['approve'],
        });

        const approval = await requestBreakGlassApproval(
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

        const approved = await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: approval.approval.id } },
        );

        await breakGlassRepository.updateApproval(requester, {
            ...approved.approval,
            dataClassification: 'SECRET',
        });

        await expect(
            presignTenantDocumentDownloadService(
                requester,
                {
                    tenantId: tenant.id,
                    documentId: documentRecord.id,
                    breakGlassApprovalId: approval.approval.id,
                },
                { documentVaultRepository, breakGlassRepository, tenantRepository },
            ),
        ).rejects.toThrow('Break-glass approval is outside current data scope.');
    });
});
