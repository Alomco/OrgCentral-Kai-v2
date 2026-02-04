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

function createDeps() {
    const breakGlassRepository = new InMemoryBreakGlassRepository();
    const tenantRepository = new InMemoryTenantRepository(tenant);
    const documentVaultRepository = new InMemoryDocumentVaultRepository([documentRecord]);
    return { breakGlassRepository, tenantRepository, documentVaultRepository };
}

describe('document vault admin break-glass failure cases', () => {
    it('rejects list requests when approval scope mismatches', async () => {
        const { breakGlassRepository, tenantRepository, documentVaultRepository } = createDeps();
        const requester = buildAuthorization('aaaa1111-1111-4111-8111-111111111111', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read'],
        });

        const approval = await requestBreakGlassApproval(
            { breakGlassRepository, tenantRepository },
            {
                authorization: requester,
                request: {
                    scope: 'platform-tools',
                    reason: 'Platform tools maintenance',
                    targetOrgId: tenant.id,
                    action: 'platform-tool.execute',
                    resourceId: 'sync-billing-status',
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
        ).rejects.toThrow('Break-glass approval scope mismatch.');
    });

    it('rejects downloads when approval action mismatches', async () => {
        const { breakGlassRepository, tenantRepository, documentVaultRepository } = createDeps();
        const requester = buildAuthorization('bbbb2222-2222-4222-8222-222222222222', {
            platformBreakGlass: ['request'],
            platformDocuments: ['download'],
        });
        const approver = buildAuthorization('bbbb3333-3333-4333-8333-333333333333', {
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

        await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: approval.approval.id } },
        );

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
        ).rejects.toThrow('Break-glass approval action mismatch.');
    });

    it('rejects downloads when approval resource mismatches', async () => {
        const { breakGlassRepository, tenantRepository, documentVaultRepository } = createDeps();
        const requester = buildAuthorization('cccc4444-4444-4444-8444-444444444444', {
            platformBreakGlass: ['request'],
            platformDocuments: ['download'],
        });
        const approver = buildAuthorization('cccc5555-5555-4555-8555-555555555555', {
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
                    resourceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                    expiresInMinutes: 30,
                },
            },
        );

        await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: approval.approval.id } },
        );

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
        ).rejects.toThrow('Break-glass approval resource mismatch.');
    });

    it('rejects reused approvals after consumption', async () => {
        const { breakGlassRepository, tenantRepository, documentVaultRepository } = createDeps();
        const requester = buildAuthorization('eeee6666-6666-4666-8666-666666666666', {
            platformBreakGlass: ['request'],
            platformDocuments: ['read'],
        });
        const approver = buildAuthorization('eeee7777-7777-4777-8777-777777777777', {
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

        await approveBreakGlassApproval(
            { breakGlassRepository },
            { authorization: approver, request: { approvalId: approval.approval.id } },
        );

        await listTenantDocumentsService(
            requester,
            tenant.id,
            approval.approval.id,
            undefined,
            { documentVaultRepository, breakGlassRepository, tenantRepository },
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
});
