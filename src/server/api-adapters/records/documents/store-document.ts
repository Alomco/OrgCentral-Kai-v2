import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { documentVaultStoreSchema } from '@/server/types/records/document-vault-schemas';
import { storeDocumentService } from '@/server/services/records/document-vault-service';
import { readJson } from '@/server/api-adapters/http/request-utils';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';

export interface StoreDocumentControllerResult {
    success: true;
    document: DocumentVaultRecord;
}

export async function storeDocumentController(request: Request): Promise<StoreDocumentControllerResult> {
    const payload = documentVaultStoreSchema.parse(await readJson(request));

    const baseAccess = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'api:records:documents:store',
            action: 'create',
            resourceType: 'records.document',
            resourceAttributes: {
                type: payload.type,
                classification: payload.classification,
                retentionPolicy: payload.retentionPolicy,
                ownerUserId: payload.ownerUserId ?? null,
            },
        },
    );

    let authorization = baseAccess.authorization;

    const ownerUserId = payload.ownerUserId ?? authorization.userId;
    if (ownerUserId !== authorization.userId) {
        const elevated = await getSessionContext(
            {},
            {
                headers: request.headers,
                requiredPermissions: { organization: ['update'] },
                auditSource: 'api:records:documents:store.elevated',
                action: 'create',
                resourceType: 'records.document',
                resourceAttributes: {
                    type: payload.type,
                    classification: payload.classification,
                    retentionPolicy: payload.retentionPolicy,
                    ownerUserId,
                },
            },
        );
        authorization = elevated.authorization;
    }

    const ownerOrgId = payload.ownerOrgId ?? authorization.orgId;
    if (ownerOrgId !== authorization.orgId) {
        throw new Error('Owner organization mismatch.');
    }

    const document = await storeDocumentService(authorization, {
        ...payload,
        orgId: authorization.orgId,
        ownerOrgId,
        ownerUserId,
    });

    return { success: true, document };
}
