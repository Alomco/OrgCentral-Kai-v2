import type { DocumentVaultRecord, DocumentVaultCreationData } from '@/server/types/records/document-vault';
import type { IDocumentVaultRepository } from '@/server/repositories/contracts/records/document-vault-repository-contract';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { assertDataCompliance } from '@/server/security/guards/data-residency-validation-guards';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import { computeRetentionExpires, toRequiredClassification } from './document-vault-helpers';
import { invalidateDocumentVaultCache } from './shared/cache-helpers';

export interface StoreDocumentInput {
    authorization: RepositoryAuthorizationContext;
    payload: DocumentVaultCreationData;
}

export interface StoreDocumentDependencies {
    documentVaultRepository: IDocumentVaultRepository;
}

export async function storeDocument(
    deps: StoreDocumentDependencies,
    input: StoreDocumentInput,
): Promise<DocumentVaultRecord> {
    const requiredClassification = toRequiredClassification(input.payload.classification);
    assertDataCompliance(
        input.authorization,
        input.authorization.dataResidency,
        requiredClassification,
        'document-vault:store',
    );

    const resolvedOwnerOrgId = input.payload.ownerOrgId ?? input.authorization.orgId;
    const resolvedOwnerUserId = input.payload.ownerUserId ?? input.authorization.userId;
    const retentionExpires =
        input.payload.retentionExpires ?? computeRetentionExpires(input.payload.retentionPolicy);

    let resolvedVersion = input.payload.version ?? 1;
    let latestVersionId = input.payload.latestVersionId;

    if (latestVersionId && input.payload.version === undefined) {
        const latest = await deps.documentVaultRepository.findById(latestVersionId);
        if (latest && latest.orgId === input.authorization.orgId) {
            resolvedVersion = latest.version + 1;
            latestVersionId = latest.id;
        }
    }

    const record = await deps.documentVaultRepository.create({
        ...input.payload,
        ownerOrgId: resolvedOwnerOrgId,
        ownerUserId: resolvedOwnerUserId,
        retentionExpires,
        version: resolvedVersion,
        latestVersionId,
    });

    await recordAuditEvent({
        orgId: input.authorization.orgId,
        userId: input.authorization.userId,
        eventType: 'DATA_CHANGE',
        action: 'records.document.created',
        resource: 'records.document',
        resourceId: record.id,
        residencyZone: input.authorization.dataResidency,
        classification: input.authorization.dataClassification,
        auditSource: input.authorization.auditSource,
        payload: {
            documentId: record.id,
            type: record.type,
            classification: record.classification,
            retentionPolicy: record.retentionPolicy,
            fileName: record.fileName,
            version: record.version,
            ownerUserId: record.ownerUserId ?? null,
        },
    });

    await invalidateDocumentVaultCache(input.authorization);
    return record;
}
