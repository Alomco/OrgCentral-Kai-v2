import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import {
  deletePermissionResourceController,
  getPermissionResourceController,
  updatePermissionResourceController,
} from '@/server/api-adapters/org/permissions/permission-route-controllers';

interface RouteParams {
  params: { orgId: string; resourceId: string };
}

export async function GET(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const result = await getPermissionResourceController(
      request,
      context.params.orgId,
      context.params.resourceId,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const result = await updatePermissionResourceController(
      request,
      context.params.orgId,
      context.params.resourceId,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteParams): Promise<NextResponse> {
  try {
    const result = await deletePermissionResourceController(
      request,
      context.params.orgId,
      context.params.resourceId,
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}