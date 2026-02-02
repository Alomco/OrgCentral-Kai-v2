import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { presignDocumentDownloadController } from '@/server/api-adapters/records/documents/presign-document-download';

export async function GET(
    request: Request,
    context: { params: Promise<{ documentId: string }> },
): Promise<NextResponse> {
    try {
        const { documentId } = await context.params;
        const result = await presignDocumentDownloadController(request, documentId);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
