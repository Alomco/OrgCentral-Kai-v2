import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { listComplianceCategoriesController } from '@/server/api-adapters/hr/compliance/list-compliance-categories';
import { upsertComplianceCategoryController } from '@/server/api-adapters/hr/compliance/upsert-compliance-category';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const result = await listComplianceCategoriesController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}

export async function PUT(request: Request): Promise<NextResponse> {
    try {
        const result = await upsertComplianceCategoryController(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
