/**
 * Integration test for time tracking authorization and IDOR prevention
 *
 * This test verifies that:
 * - Users can only modify their own time entries
 * - Users cannot approve their own entries
 * - Managers can approve subordinate entries
 * - Non-privileged users cannot approve any entries
 * - Users can only list their own entries (tenant scoping)
 *
 * Priority: P3 (Deferred)
 * Estimated Effort: 5 hours
 * Coverage Impact: +20%
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthorizationError } from '@/server/errors';
import { HR_PERMISSION_PROFILE } from '@/server/security/authorization/hr-permissions/profiles';
import { updateTimeEntry } from '@/server/use-cases/hr/time-tracking/update-time-entry';
import { approveTimeEntry } from '@/server/use-cases/hr/time-tracking/approve-time-entry';
import { listTimeEntries } from '@/server/use-cases/hr/time-tracking/list-time-entries';
import { buildMockAuthorization, buildMockTimeEntry } from '../fixtures/time-entry-fixtures';
import { createMockTimeEntryRepository } from '../mocks/time-entry-repository.mock';

const mocks = vi.hoisted(() => ({
    emitHrNotificationMock: vi.fn(),
    invalidateTimeEntryCacheMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/use-cases/hr/notifications/notification-emitter', () => ({
    emitHrNotification: mocks.emitHrNotificationMock,
}));

vi.mock('@/server/use-cases/hr/time-tracking/cache-helpers', () => ({
    invalidateTimeEntryCache: mocks.invalidateTimeEntryCacheMock,
    registerTimeEntryCache: vi.fn(),
}));

describe('Time Entry Authorization & IDOR Prevention', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should prevent User A from updating User B time entry', async () => {
        const authorization = buildMockAuthorization(
            HR_PERMISSION_PROFILE.TIME_ENTRY_UPDATE,
            { userId: 'user-a' },
        );
        const repository = createMockTimeEntryRepository();
        repository.getTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-idor',
            userId: 'user-b',
            orgId: authorization.orgId,
            status: 'ACTIVE',
            clockOut: null,
        }));

        await expect(updateTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-idor',
                payload: { notes: 'Attempted unauthorized update' },
            },
        )).rejects.toThrow(AuthorizationError);

        expect(repository.updateTimeEntry).not.toHaveBeenCalled();
    });

    it('should prevent user from approving own entry', async () => {
        const authorization = buildMockAuthorization(
            HR_PERMISSION_PROFILE.TIME_ENTRY_APPROVE,
            { userId: 'approver-1' },
        );
        const repository = createMockTimeEntryRepository();
        repository.getTimeEntry.mockResolvedValue(buildMockTimeEntry({
            id: 'entry-self',
            userId: 'approver-1',
            orgId: authorization.orgId,
            status: 'COMPLETED',
        }));

        await expect(approveTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-self',
                payload: { status: 'APPROVED' },
            },
        )).rejects.toThrow(AuthorizationError);

        expect(repository.updateTimeEntry).not.toHaveBeenCalled();
    });

    it('should allow manager to approve subordinate entry', async () => {
        const authorization = buildMockAuthorization(
            HR_PERMISSION_PROFILE.TIME_ENTRY_APPROVE,
            { userId: 'manager-1' },
        );
        const repository = createMockTimeEntryRepository();
        const existing = buildMockTimeEntry({
            id: 'entry-subordinate',
            userId: 'employee-1',
            orgId: authorization.orgId,
            status: 'COMPLETED',
            metadata: {},
        });
        repository.getTimeEntry.mockResolvedValue(existing);
        repository.updateTimeEntry.mockImplementation(async (_, __, updates) => buildMockTimeEntry({
            ...existing,
            ...updates,
            id: 'entry-subordinate',
            orgId: authorization.orgId,
        }));

        const result = await approveTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-subordinate',
                payload: { status: 'APPROVED', comments: 'Looks good' },
            },
        );

        expect(result.entry.status).toBe('APPROVED');
        expect(result.entry.approvedByUserId).toBe('manager-1');
        expect(repository.updateTimeEntry).toHaveBeenCalledOnce();
    });

    it('should prevent non-privileged user from approving any entry', async () => {
        const authorization = buildMockAuthorization(
            HR_PERMISSION_PROFILE.TIME_ENTRY_UPDATE,
            { userId: 'employee-2' },
        );
        const repository = createMockTimeEntryRepository();

        await expect(approveTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-x',
                payload: { status: 'APPROVED' },
            },
        )).rejects.toThrow(AuthorizationError);

        expect(repository.getTimeEntry).not.toHaveBeenCalled();
        expect(repository.updateTimeEntry).not.toHaveBeenCalled();
    });

    it('should only return own entries when listing (tenant scoping)', async () => {
        const authorization = buildMockAuthorization(
            HR_PERMISSION_PROFILE.TIME_ENTRY_LIST,
            { userId: 'user-scope' },
        );
        const repository = createMockTimeEntryRepository();
        repository.listTimeEntries.mockResolvedValue([
            buildMockTimeEntry({ id: 'entry-own', userId: 'user-scope', orgId: authorization.orgId }),
        ]);

        const result = await listTimeEntries(
            { timeEntryRepository: repository },
            { authorization },
        );

        expect(repository.listTimeEntries).toHaveBeenCalledWith(
            authorization.orgId,
            expect.objectContaining({ userId: 'user-scope' }),
        );
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0]?.userId).toBe('user-scope');
    });
});

/*
 * Implementation TODO:
 *
 * 1. Create test fixtures for multiple users (User A, User B, Manager)
 * 2. Mock repository with entries belonging to different users
 * 3. Call use-cases with mismatched authorization contexts
 * 4. Assert AuthorizationError thrown with expected messages
 * 5. Test permission matrix:
 *    - TIME_ENTRY_CREATE: Own entries only
 *    - TIME_ENTRY_UPDATE: Own entries only
 *    - TIME_ENTRY_APPROVE: Others' entries only (not own)
 *    - TIME_ENTRY_MANAGE: All entries in org
 *
 * See: docs/test/hr-time-tracking-test-plan.md (Section 2.2)
 */
