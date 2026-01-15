import { NextResponse } from 'next/server';
import { triggerOnboardingReminderCron } from '@/server/api-adapters/cron/onboarding-reminders';
import { buildErrorResponse } from '@/server/api-adapters/http/error-response';

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const result = await triggerOnboardingReminderCron(request);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return buildErrorResponse(error);
    }
}
