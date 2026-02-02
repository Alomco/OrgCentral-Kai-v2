import { NextResponse } from 'next/server';
import {
    listBillingPlansController,
    createBillingPlanController,
    updateBillingPlanController,
} from '@/server/api-adapters/platform/admin/billing-plans-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listBillingPlansController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const result = await createBillingPlanController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}

export async function PATCH(request: Request) {
    try {
        const result = await updateBillingPlanController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
