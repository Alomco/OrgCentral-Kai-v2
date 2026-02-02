import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { presignDocumentUploadController } from '@/server/api-adapters/records/documents/presign-document-upload';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await presignDocumentUploadController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
