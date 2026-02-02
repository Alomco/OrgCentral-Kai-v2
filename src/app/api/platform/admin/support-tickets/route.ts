import { NextResponse } from 'next/server';
import {
    listSupportTicketsController,
    createSupportTicketController,
    updateSupportTicketController,
} from '@/server/api-adapters/platform/admin/support-tickets-controller';
import { DefaultErrorMapper } from '@/server/api-adapters/error-mappers/default-error-mapper';

export async function GET(request: Request) {
    try {
        const result = await listSupportTicketsController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const result = await createSupportTicketController(request);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}

export async function PATCH(request: Request) {
    try {
        const result = await updateSupportTicketController(request);
        return NextResponse.json(result);
    } catch (error) {
        return DefaultErrorMapper.mapErrorToResponse(error);
    }
}
