import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';

import { exportHrReportController } from '@/server/api-adapters/hr/reports/export';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function GET(request: Request): Promise<NextResponse> {
    noStore();
    try {
        const result = await exportHrReportController(request);
        const body = typeof result.body === 'string'
            ? result.body
            : Uint8Array.from(result.body).buffer;
        return new NextResponse(body, {
            status: 200,
            headers: {
                'Content-Type': result.contentType,
                'Content-Disposition': `attachment; filename="${result.fileName}"`,
            },
        });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
