import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import { exportMembersCsvController } from '@/server/api-adapters/org/members/members-export-controller';

interface RouteParams { params: { orgId: string } }

export async function GET(request: Request, context: RouteParams): Promise<Response> {
  try {
    return await exportMembersCsvController(request, context.params.orgId);
  } catch (error) {
    const res = buildErrorResponse(error);
    return new Response(await res.text(), { status: res.status, headers: res.headers });
  }
}
