import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { listDocumentsController } from '@/server/api-adapters/records/documents/list-documents';
import { storeDocumentController } from '@/server/api-adapters/records/documents/store-document';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const result = await listDocumentsController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const result = await storeDocumentController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
