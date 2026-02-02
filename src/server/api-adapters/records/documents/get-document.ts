import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { getDocumentService } from '@/server/services/records/document-vault-service';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import { hasPermission } from '@/lib/security/permission-check';

export interface GetDocumentControllerResult {
    success: true;
    document: DocumentVaultRecord;
}

export async function getDocumentController(
    request: Request,
    documentId: string,
): Promise<GetDocumentControllerResult> {
    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { employeeProfile: ['read'] },
            auditSource: 'api:records:documents:get',
            action: 'read',
            resourceType: 'records.document',
            resourceAttributes: { documentId },
        },
    );

    const document = await getDocumentService(authorization, documentId);

    if (!document) {
        throw new Error('Document not found.');
    }

    const canReadAll = hasPermission(authorization.permissions, 'organization', 'read');
    if (document.ownerUserId && document.ownerUserId !== authorization.userId && !canReadAll) {
        throw new Error('Not authorized to access this document.');
    }

    return { success: true, document };
}
