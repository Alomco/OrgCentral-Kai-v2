import { describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const submitLeaveRequestControllerMock = vi.fn();
const approveLeaveRequestControllerMock = vi.fn();
const enforceCsrfOriginGuardMock = vi.fn();

vi.mock('@/server/api-adapters/hr/leave/submit-leave-request', () => ({
    submitLeaveRequestController: submitLeaveRequestControllerMock,
}));

vi.mock('@/server/api-adapters/hr/leave/approve-leave-request', () => ({
    approveLeaveRequestController: approveLeaveRequestControllerMock,
}));

vi.mock('@/server/security/guards/csrf-origin-guard', () => ({
    enforceCsrfOriginGuard: enforceCsrfOriginGuardMock,
}));

describe('leave API routes csrf guard', () => {
    it('blocks /api/hr/leave POST before controller execution when origin is untrusted', async () => {
        const forbiddenResponse = NextResponse.json(
            { error: { code: 'AUTHORIZATION_ERROR', message: 'Invalid origin.' } },
            { status: 403 },
        );
        enforceCsrfOriginGuardMock.mockResolvedValueOnce(forbiddenResponse);

        const { POST } = await import('@/app/api/hr/leave/route');
        const response = await POST(new Request('http://localhost/api/hr/leave', { method: 'POST' }));

        expect(response.status).toBe(403);
        expect(submitLeaveRequestControllerMock).not.toHaveBeenCalled();
    }, 120000);

    it('blocks /api/hr/leave/[requestId]/approve POST before controller execution when origin is untrusted', async () => {
        const forbiddenResponse = NextResponse.json(
            { error: { code: 'AUTHORIZATION_ERROR', message: 'Invalid origin.' } },
            { status: 403 },
        );
        enforceCsrfOriginGuardMock.mockResolvedValueOnce(forbiddenResponse);

        const { POST } = await import('@/app/api/hr/leave/[requestId]/approve/route');
        const response = await POST(
            new Request('http://localhost/api/hr/leave/req-1/approve', { method: 'POST' }),
            { params: Promise.resolve({ requestId: 'req-1' }) },
        );

        expect(response.status).toBe(403);
        expect(approveLeaveRequestControllerMock).not.toHaveBeenCalled();
    }, 120000);
});
