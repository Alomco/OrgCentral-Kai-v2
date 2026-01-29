import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { listAuditLogsController } from '@/server/api-adapters/org/audit/audit-route-controllers';

interface RouteParams { params: Promise<{ orgId: string }> }

export async function GET(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const { orgId } = await context.params;
    const result = await listAuditLogsController(request, orgId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
