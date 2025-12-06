import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';
import {
  composeNotificationController,
  listNotificationsController,
} from '@/server/api-adapters/notifications/notifications-controller';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const result = await listNotificationsController(request);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const result = await composeNotificationController(request);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return buildErrorResponse(error);
  }
}
