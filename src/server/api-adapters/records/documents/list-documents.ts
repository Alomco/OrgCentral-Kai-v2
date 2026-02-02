import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';
import {
    documentVaultListQuerySchema,
    type DocumentVaultListQuery,
} from '@/server/types/records/document-vault-schemas';
import { listDocumentsService } from '@/server/services/records/document-vault-service';

export interface ListDocumentsControllerResult {
    success: true;
    documents: DocumentVaultRecord[];
}

function parseQuery(request: Request): DocumentVaultListQuery {
    const params = new URL(request.url).searchParams;
    return documentVaultListQuerySchema.parse({
        ownerUserId: params.get('ownerUserId') ?? undefined,
        type: params.get('type') ?? undefined,
        classification: params.get('classification') ?? undefined,
        retentionPolicy: params.get('retentionPolicy') ?? undefined,
        fileName: params.get('fileName') ?? undefined,
    });
}

export async function listDocumentsController(request: Request): Promise<ListDocumentsControllerResult> {
    const query = parseQuery(request);

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'api:records:documents:list',
            action: 'read',
            resourceType: 'records.document',
            resourceAttributes: query,
        },
    );

    const documents = await listDocumentsService(authorization, query);

    return { success: true, documents };
}
