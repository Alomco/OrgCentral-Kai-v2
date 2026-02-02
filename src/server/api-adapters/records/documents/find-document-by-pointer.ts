import { getSessionContext } from '@/server/use-cases/auth/sessions/get-session';
import { findDocumentByPointerService } from '@/server/services/records/document-vault-service';
import { z } from 'zod';
import type { DocumentVaultRecord } from '@/server/types/records/document-vault';

const pointerQuerySchema = z.object({
    blobPointer: z.string().min(1),
});

export interface FindDocumentByPointerControllerResult {
    success: true;
    document: DocumentVaultRecord | null;
}

export async function findDocumentByPointerController(
    request: Request,
): Promise<FindDocumentByPointerControllerResult> {
    const params = new URL(request.url).searchParams;
    const query = pointerQuerySchema.parse({ blobPointer: params.get('blobPointer') ?? '' });

    const { authorization } = await getSessionContext(
        {},
        {
            headers: request.headers,
            requiredPermissions: { organization: ['read'] },
            auditSource: 'api:records:documents:find',
            action: 'read',
            resourceType: 'records.document',
            resourceAttributes: { blobPointer: query.blobPointer },
        },
    );

    const document = await findDocumentByPointerService(authorization, query.blobPointer);

    return { success: true, document };
}
