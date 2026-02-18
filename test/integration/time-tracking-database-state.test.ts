/**
 * Integration test for time tracking database state verification
 *
 * This test verifies that:
 * - Created entries have correct tenant scoping (orgId, classification, residency)
 * - Metadata field preserves JSON structure
 * - Timestamps auto-populate correctly
 * - Update operations change updatedAt timestamp
 * - Approval populates decision fields correctly
 *
 * Priority: P3 (Deferred)
 * Estimated Effort: 4 hours
 * Coverage Impact: +15%
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ITimeEntryRepository } from '@/server/repositories/contracts/hr/time-tracking/time-entry-repository-contract';
import type { TimeEntry } from '@/server/types/hr-ops-types';
import type { CreateTimeEntryPayload } from '@/server/types/hr-time-tracking-schemas';
import { HR_PERMISSION_PROFILE } from '@/server/security/authorization/hr-permissions/profiles';
import { createTimeEntry } from '@/server/use-cases/hr/time-tracking/create-time-entry';
import { updateTimeEntry } from '@/server/use-cases/hr/time-tracking/update-time-entry';
import { approveTimeEntry } from '@/server/use-cases/hr/time-tracking/approve-time-entry';
import { buildMockAuthorization, buildMockTimeEntry } from '../fixtures/time-entry-fixtures';

const mocks = vi.hoisted(() => ({
    emitHrNotificationMock: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    invalidateTimeEntryCacheMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/use-cases/hr/notifications/notification-emitter', () => ({
    emitHrNotification: mocks.emitHrNotificationMock,
}));

vi.mock('@/server/use-cases/hr/time-tracking/cache-helpers', () => ({
    invalidateTimeEntryCache: mocks.invalidateTimeEntryCacheMock,
    registerTimeEntryCache: vi.fn(),
}));

function createDeterministicRepository(seedEntry?: TimeEntry): ITimeEntryRepository {
    let currentId = 0;
    const state = new Map<string, TimeEntry>();

    if (seedEntry) {
        state.set(seedEntry.id, seedEntry);
    }

    return {
        createTimeEntry: vi.fn(async (_, input) => {
            currentId += 1;
            const now = new Date();
            const entry: TimeEntry = {
                ...input,
                id: `entry-${String(currentId).padStart(3, '0')}`,
                status: input.status ?? 'ACTIVE',
                createdAt: now,
                updatedAt: now,
            };
            state.set(entry.id, entry);
            return entry;
        }),
        updateTimeEntry: vi.fn(async (_, id, updates) => {
            const existing = state.get(id);
            if (!existing) {
                throw new Error(`Missing entry: ${id}`);
            }
            const updated: TimeEntry = {
                ...existing,
                ...updates,
                updatedAt: new Date(),
            };
            state.set(id, updated);
            return updated;
        }),
        getTimeEntry: vi.fn(async (_, id) => state.get(id) ?? null),
        listTimeEntries: vi.fn(async (_, filters) => {
            const values = Array.from(state.values());
            if (!filters?.userId) {
                return values;
            }
            return values.filter((entry) => entry.userId === filters.userId);
        }),
    };
}

describe('Time Entry Database State Verification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-17T10:00:00.000Z'));
    });

    it('should create entry with correct tenant scoping', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_CREATE, {
            orgId: 'org-db-1',
            dataClassification: 'OFFICIAL',
            dataResidency: 'UK_ONLY',
        });
        const repository = createDeterministicRepository();

        const result = await createTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                payload: {
                    userId: authorization.userId,
                    clockIn: new Date('2026-02-17T09:00:00.000Z'),
                    clockOut: new Date('2026-02-17T17:00:00.000Z'),
                    breakDuration: 1,
                },
            },
        );

        expect(result.entry.orgId).toBe('org-db-1');
        expect(result.entry.dataClassification).toBe('OFFICIAL');
        expect(result.entry.residencyTag).toBe('UK_ONLY');
    });

    it('should preserve complex metadata JSON structure', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_APPROVE, {
            userId: 'manager-db',
        });
        const repository = createDeterministicRepository(buildMockTimeEntry({
            id: 'entry-metadata-1',
            orgId: authorization.orgId,
            userId: 'member-3',
            status: 'COMPLETED',
            clockOut: new Date('2026-02-17T17:00:00.000Z'),
            metadata: {
                nested: {
                    levels: [1, 2, 3],
                    labels: ['alpha', 'ßeta'],
                },
                tags: ['ops', 'integration'],
            },
        }));

        const result = await approveTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-metadata-1',
                payload: {
                    status: 'APPROVED',
                    comments: 'Reviewed',
                    metadata: { overtimeHours: 1.25 },
                },
            },
        );

        const metadata = result.entry.metadata as {
            nested?: { levels?: number[]; labels?: string[] };
            tags?: string[];
            overtimeHours?: number;
            decisionHistory?: Array<{ status: string }>;
        };

        expect(metadata.nested?.levels).toEqual([1, 2, 3]);
        expect(metadata.tags).toEqual(['ops', 'integration']);
        expect(metadata.overtimeHours).toBe(1.25);
        expect(metadata.decisionHistory?.[0]?.status).toBe('APPROVED');
    });

    it('should auto-populate createdAt and updatedAt timestamps', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_CREATE);
        const repository = createDeterministicRepository();

        const result = await createTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                payload: {
                    userId: authorization.userId,
                    clockIn: new Date('2026-02-17T09:00:00.000Z'),
                    clockOut: new Date('2026-02-17T17:00:00.000Z'),
                } satisfies CreateTimeEntryPayload,
            },
        );

        expect(result.entry.createdAt).toBeInstanceOf(Date);
        expect(result.entry.updatedAt).toBeInstanceOf(Date);
        expect(result.entry.createdAt.toISOString()).toBe('2026-02-17T10:00:00.000Z');
        expect(result.entry.updatedAt.toISOString()).toBe('2026-02-17T10:00:00.000Z');
    });

    it('should update updatedAt timestamp on modification', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_UPDATE);
        const seed = buildMockTimeEntry({
            id: 'entry-update-ts',
            orgId: authorization.orgId,
            userId: authorization.userId,
            status: 'COMPLETED',
            createdAt: new Date('2026-02-17T08:00:00.000Z'),
            updatedAt: new Date('2026-02-17T08:00:00.000Z'),
        });
        const repository = createDeterministicRepository(seed);

        vi.setSystemTime(new Date('2026-02-17T10:30:00.000Z'));

        const result = await updateTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-update-ts',
                payload: { notes: 'Adjusted note' },
            },
        );

        expect(result.entry.createdAt.toISOString()).toBe('2026-02-17T08:00:00.000Z');
        expect(result.entry.updatedAt.toISOString()).toBe('2026-02-17T10:30:00.000Z');
    });

    it('should populate approval fields when entry is approved', async () => {
        const authorization = buildMockAuthorization(HR_PERMISSION_PROFILE.TIME_ENTRY_APPROVE, {
            userId: 'manager-approve',
        });
        const repository = createDeterministicRepository(buildMockTimeEntry({
            id: 'entry-approval-fields',
            orgId: authorization.orgId,
            userId: 'employee-approval',
            status: 'COMPLETED',
            approvedByOrgId: null,
            approvedByUserId: null,
            approvedAt: null,
        }));

        vi.setSystemTime(new Date('2026-02-17T11:00:00.000Z'));

        const result = await approveTimeEntry(
            { timeEntryRepository: repository },
            {
                authorization,
                entryId: 'entry-approval-fields',
                payload: { status: 'APPROVED', comments: 'Approved for payroll' },
            },
        );

        expect(result.entry.status).toBe('APPROVED');
        expect(result.entry.approvedByOrgId).toBe(authorization.orgId);
        expect(result.entry.approvedByUserId).toBe('manager-approve');
        expect(result.entry.approvedAt?.toISOString()).toBe('2026-02-17T11:00:00.000Z');
    });

    afterEach(() => {
        vi.useRealTimers();
    });
});

/*
 * Implementation TODO:
 *
 * 1. Mock repository to return entries with specific tenant attributes
 * 2. Verify returned objects match expected structure
 * 3. Test metadata serialization/deserialization:
 *    - Arrays, nested objects, special characters
 *    - Ensure toJsonValue() converts correctly
 * 4. Test timestamp behavior:
 *    - createdAt ≈ now
 *    - updatedAt > createdAt after update
 * 5. Test approval state:
 *    - approvedByOrgId, approvedByUserId, approvedAt all populated
 *    - metadata.decisionHistory array contains decision entry
 *
 * See: docs/test/hr-time-tracking-test-plan.md (Section 2.3)
 */
