/**
 * Integration test for structured logging output in time tracking
 *
 * This test verifies that:
 * - Notification failures are logged with correct event names
 * - Log context includes entryId, orgId, error message
 * - Audit logger is called for create/update/approve actions
 * - Audit events contain ISO27001-aligned metadata
 *
 * Priority: P3 (Deferred)
 * Estimated Effort: 3 hours
 * Coverage Impact: +10%
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HR_PERMISSION_PROFILE } from '@/server/security/authorization/hr-permissions/profiles';
import { createTimeEntry } from '@/server/use-cases/hr/time-tracking/create-time-entry';
import { updateTimeEntry } from '@/server/use-cases/hr/time-tracking/update-time-entry';
import { approveTimeEntry } from '@/server/use-cases/hr/time-tracking/approve-time-entry';
import { buildMockAuthorization, buildMockTimeEntry } from '../fixtures/time-entry-fixtures';
import { createMockTimeEntryRepository } from '../mocks/time-entry-repository.mock';

const mocks = vi.hoisted(() => ({
    emitHrNotificationMock: vi.fn(),
    invalidateTimeEntryCacheMock: vi.fn().mockResolvedValue(undefined),
    appLoggerWarnMock: vi.fn(),
    recordAuditEventMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/use-cases/hr/notifications/notification-emitter', () => ({
    emitHrNotification: mocks.emitHrNotificationMock,
}));

vi.mock('@/server/use-cases/hr/time-tracking/cache-helpers', () => ({
    invalidateTimeEntryCache: mocks.invalidateTimeEntryCacheMock,
    registerTimeEntryCache: vi.fn(),
}));

vi.mock('@/server/logging/structured-logger', () => ({
    appLogger: {
        warn: mocks.appLoggerWarnMock,
        info: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@/server/logging/audit-logger', () => ({
    recordAuditEvent: mocks.recordAuditEventMock,
}));

describe('Time Entry Structured Logging', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should log create notification failures with correct event name', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_CREATE);
        const repository = createMockTimeEntryRepository();
        repository.createTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-log-create',
            orgId: authorization.orgId,
            userId: authorization.userId,
        }));
        mocks.emitHrNotificationMock.mockRejectedValueOnce(new Error('create notify fail'));

        await createTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                payload: {
                    userId: authorization.userId,
                    clockIn: new Date('2026-02-17T09:00:00.000Z'),
                    clockOut: new Date('2026-02-17T17:00:00.000Z'),
                },
            },
        );

        expect(mocks.appLoggerWarnMock).toHaveBeenCalledWith(
            'hr.time-tracking.create.notification.failed',
            expect.objectContaining({
                entryId: 'entry-log-create',
                orgId: authorization.orgId,
                error: 'create notify fail',
            }),
        );
    });

    it('should log update notification failures with correct event name', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_UPDATE);
        const repository = createMockTimeEntryRepository();
        repository.getTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-log-update',
            orgId: authorization.orgId,
            userId: authorization.userId,
            status: 'COMPLETED',
        }));
        repository.updateTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-log-update',
            orgId: authorization.orgId,
            userId: authorization.userId,
            status: 'COMPLETED',
            notes: 'Updated note',
        }));
        mocks.emitHrNotificationMock.mockRejectedValueOnce(new Error('update notify fail'));

        await updateTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-log-update',
                payload: { notes: 'Updated note' },
            },
        );

        expect(mocks.appLoggerWarnMock).toHaveBeenCalledWith(
            'hr.time-tracking.update.notification.failed',
            expect.objectContaining({
                entryId: 'entry-log-update',
                orgId: authorization.orgId,
                error: 'update notify fail',
            }),
        );
    });

    it('should log approve notification failures with correct event name', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_APPROVE, {
            userId: 'manager-log-1',
        });
        const repository = createMockTimeEntryRepository();
        repository.getTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-log-approve',
            orgId: authorization.orgId,
            userId: 'member-log-1',
            status: 'COMPLETED',
        }));
        repository.updateTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-log-approve',
            orgId: authorization.orgId,
            userId: 'member-log-1',
            status: 'APPROVED',
            approvedByOrgId: authorization.orgId,
            approvedByUserId: authorization.userId,
            approvedAt: new Date('2026-02-17T12:00:00.000Z'),
        }));
        mocks.emitHrNotificationMock.mockRejectedValueOnce(new Error('approve notify fail'));

        await approveTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-log-approve',
                payload: { status: 'APPROVED' },
            },
        );

        expect(mocks.appLoggerWarnMock).toHaveBeenCalledWith(
            'hr.time-tracking.approve.notification.failed',
            expect.objectContaining({
                entryId: 'entry-log-approve',
                orgId: authorization.orgId,
                error: 'approve notify fail',
            }),
        );
    });

    it('should record audit event for CREATE action', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_CREATE, {
            ipAddress: '10.0.0.1',
            userAgent: 'vitest-agent/1.0',
            correlationId: 'corr-create-1',
        });
        const repository = createMockTimeEntryRepository();
        repository.createTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-audit-create',
            orgId: authorization.orgId,
            userId: authorization.userId,
            status: 'COMPLETED',
        }));
        mocks.emitHrNotificationMock.mockResolvedValueOnce({ id: 'notif-create' });

        await createTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                payload: {
                    userId: authorization.userId,
                    clockIn: new Date('2026-02-17T09:00:00.000Z'),
                    clockOut: new Date('2026-02-17T17:00:00.000Z'),
                },
            },
        );

        expect(mocks.recordAuditEventMock).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'DATA_CHANGE',
            action: 'create',
            resource: 'hr.time.entry',
            resourceId: 'entry-audit-create',
            orgId: authorization.orgId,
            userId: authorization.userId,
            residencyZone: authorization.dataResidency,
            classification: authorization.dataClassification,
            auditSource: authorization.auditSource,
            correlationId: 'corr-create-1',
            payload: expect.objectContaining({
                targetUserId: authorization.userId,
                status: 'COMPLETED',
                ipAddress: '10.0.0.1',
                userAgent: 'vitest-agent/1.0',
            }),
        }));
    });

    it('should record audit event for UPDATE action with updateKeys', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_UPDATE, {
            correlationId: 'corr-update-1',
        });
        const repository = createMockTimeEntryRepository();
        repository.getTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-audit-update',
            orgId: authorization.orgId,
            userId: authorization.userId,
            status: 'COMPLETED',
            notes: null,
        }));
        repository.updateTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-audit-update',
            orgId: authorization.orgId,
            userId: authorization.userId,
            status: 'COMPLETED',
            notes: 'Updated by audit test',
        }));
        mocks.emitHrNotificationMock.mockResolvedValueOnce({ id: 'notif-update' });

        await updateTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-audit-update',
                payload: { notes: 'Updated by audit test' },
            },
        );

        expect(mocks.recordAuditEventMock).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'DATA_CHANGE',
            action: 'update',
            resource: 'hr.time.entry',
            resourceId: 'entry-audit-update',
            correlationId: 'corr-update-1',
            payload: expect.objectContaining({
                targetUserId: authorization.userId,
                status: 'COMPLETED',
                updateKeys: expect.arrayContaining(['notes']),
            }),
        }));
    });
});

/*
 * Implementation TODO:
 *
 * 1. Mock appLogger and recordAuditEvent
 * 2. Trigger notification failures
 * 3. Assert appLogger.warn called with:
 *    - Event: 'hr.time-tracking.<action>.notification.failed'
 *    - Context: { entryId, orgId, error }
 * 4. Assert recordAuditEvent called with:
 *    - eventType: 'DATA_CHANGE'
 *    - action: CREATE | UPDATE | APPROVE
 *    - resource: TIME_ENTRY
 *    - residencyZone, classification, auditSource
 *    - payload with ipAddress, userAgent, status
 * 5. Verify audit log structure matches ISO27001 requirements
 *
 * See: docs/test/hr-time-tracking-test-plan.md (Section 2.4)
 */
