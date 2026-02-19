import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapPrismaLeaveRequestToDomain } from '@/server/repositories/mappers/hr/leave/leave-mapper';

function buildRecord(
    overrides: Partial<Parameters<typeof mapPrismaLeaveRequestToDomain>[0]> = {},
): Parameters<typeof mapPrismaLeaveRequestToDomain>[0] {
    return {
        id: 'request-1',
        orgId: 'org-1',
        residencyTag: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
        auditBatchId: null,
        userId: 'user-1',
        policyId: 'ANNUAL',
        startDate: new Date('2026-02-17T00:00:00.000Z'),
        endDate: new Date('2026-02-18T00:00:00.000Z'),
        reason: 'Reason',
        hours: new Prisma.Decimal(16),
        status: 'SUBMITTED',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        submittedAt: new Date('2026-02-02T00:00:00.000Z'),
        approverUserId: null,
        decidedAt: null,
        metadata: {
            employeeId: 'EMP-001',
            employeeName: 'No Man',
            leaveType: 'ANNUAL',
            totalDays: 2,
            isHalfDay: false,
            cancelledBy: 'manager-1',
            cancelledAt: '2026-02-03T10:00:00.000Z',
            cancellationReason: 'Changed plans',
        },
        ...overrides,
    };
}

describe('leave mapper status mapping', () => {
    it('does not expose approval or rejection fields for cancelled requests', () => {
        const result = mapPrismaLeaveRequestToDomain(buildRecord({
            status: 'CANCELLED',
            approverUserId: 'approver-1',
            decidedAt: new Date('2026-02-03T08:00:00.000Z'),
        }));

        expect(result.status).toBe('cancelled');
        expect(result.approvedBy).toBeUndefined();
        expect(result.approvedAt).toBeUndefined();
        expect(result.rejectedBy).toBeUndefined();
        expect(result.rejectedAt).toBeUndefined();
        expect(result.rejectionReason).toBeUndefined();
        expect(result.cancelledBy).toBe('manager-1');
        expect(result.cancelledAt).toBe('2026-02-03T10:00:00.000Z');
        expect(result.cancellationReason).toBe('Changed plans');
    });

    it('maps decision fields only for the matching terminal status', () => {
        const approved = mapPrismaLeaveRequestToDomain(buildRecord({
            status: 'APPROVED',
            approverUserId: 'approver-1',
            decidedAt: new Date('2026-02-03T08:00:00.000Z'),
        }));

        expect(approved.approvedBy).toBe('approver-1');
        expect(approved.rejectedBy).toBeUndefined();
        expect(approved.rejectionReason).toBeUndefined();

        const rejected = mapPrismaLeaveRequestToDomain(buildRecord({
            status: 'REJECTED',
            approverUserId: 'approver-2',
            decidedAt: new Date('2026-02-04T08:00:00.000Z'),
            reason: 'Insufficient notice',
        }));

        expect(rejected.approvedBy).toBeUndefined();
        expect(rejected.rejectedBy).toBe('approver-2');
        expect(rejected.rejectionReason).toBe('Insufficient notice');
    });
});
