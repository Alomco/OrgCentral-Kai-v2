import { describe, expect, it, vi } from 'vitest';

import {
    listTenantDocumentsService,
    presignTenantDocumentDownloadService,
} from '@/server/services/platform/admin/document-vault-service';
import { approveBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/approve-break-glass';
import { requestBreakGlassApproval } from '@/server/use-cases/platform/admin/break-glass/request-break-glass';
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

describe('document vault admin break-glass flow', () => {
    it('requests, approves, and consumes break-glass for list + download', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);

        const requester = buildAuthorization('22222222-2222-4222-8222-222222222222', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read', 'download'],
        });
        const approver = buildAuthorization('33333333-3333-4333-8333-333333333333', {
            platformBreakGlass: ['approve'],
        });

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

    it('rejects list requests when approval is missing', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('44444444-4444-4444-8444-444444444444', {
            platformDocuments: ['read'],
            platformBreakGlass: ['read'],
        });

        await expect(
            listTenantDocumentsService(
                requester,
                tenant.id,
                '55555555-5555-4555-8555-555555555555',
                undefined,
                { documentVaultRepository, breakGlassRepository, tenantRepository },
            ),
        ).rejects.toThrow('Break-glass approval not found.');
    });

    it('rejects downloads when approval is expired', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('66666666-6666-4666-8666-666666666666', {
            platformBreakGlass: ['request'],
            platformDocuments: ['download'],
        });
        const approver = buildAuthorization('77777777-7777-4777-8777-777777777777', {
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
            expiresAt: new Date(Date.now() - 1000).toISOString(),
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
        ).rejects.toThrow('Break-glass approval has expired.');
    });

    it('rejects list requests when approval is expired', async () => {
        const breakGlassRepository = new InMemoryBreakGlassRepository();
        const tenantRepository = new InMemoryTenantRepository(tenant);
        const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
        const requester = buildAuthorization('88888888-8888-4888-8888-888888888888', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read'],
        });
        const approver = buildAuthorization('99999999-9999-4999-8999-999999999999', {
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
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });

        await expect(
            listTenantDocumentsService(
                requester,
                tenant.id,
                approval.approval.id,
                undefined,
                { documentVaultRepository, breakGlassRepository, tenantRepository },
            ),
        ).rejects.toThrow('Break-glass approval has expired.');
    });
});
