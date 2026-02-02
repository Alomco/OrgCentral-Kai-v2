import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { presignAdminDocumentDownloadController } from '@/server/api-adapters/platform/admin/document-vault/presign-document-download';

export async function GET(
    request: Request,
    context: { params: Promise<{ documentId: string }> },
): Promise<NextResponse> {
    try {
        const { documentId } = await context.params;
        const result = await presignAdminDocumentDownloadController(request, documentId);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
