import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveRequest } from '@/server/types/leave-types';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';
import type { CancelLeaveRequestResult, EnsureEmployeeBalancesResult } from '@/server/use-cases/hr/leave';
import {
    authorization,
    buildAbsence,
    buildLeaveBalance,
    buildLeaveRequest,
    createService,
    PROFILE_ID,
    timestamp,
} from './people-orchestration.test-helpers';

vi.mock('../helpers/people-orchestration.helpers', () => ({
    registerSummaryCaches: vi.fn(),
    invalidateOnboardCaches: vi.fn(async () => undefined),
    invalidateEligibilityCaches: vi.fn(async () => undefined),
    invalidateTerminationCaches: vi.fn(async () => undefined),
    invalidateComplianceAssignmentCaches: vi.fn(async () => undefined),
    buildTelemetryMetadata: vi.fn((operation: string, _auth: RepositoryAuthorizationContext, metadata?: Record<string, string>) => ({
        auditSource: `service:hr:people.${operation}`,
        ...metadata,
    })),
}));

const TARGET_USER_ID = '33333333-3333-4333-8333-333333333333';

const baseEmployeeProfile: EmployeeProfileDTO = {
    id: PROFILE_ID,
    orgId: authorization.orgId,
    userId: TARGET_USER_ID,
    employeeNumber: 'EMP-1',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    healthStatus: 'UNDEFINED',
    createdAt: timestamp,
    updatedAt: timestamp,
};

describe('PeopleOrchestrationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('onboardEmployee creates profile, optional contract, ensures balances', async () => {
        const { service, deps } = createService();

        const result = await service.onboardEmployee({
            authorization,
            profileDraft: {
                userId: TARGET_USER_ID,
                employeeNumber: 'EMP-2',
                employmentType: 'FULL_TIME',
            },
            eligibleLeaveTypes: ['annual'],
        });

        expect(result.profileId).toBe(PROFILE_ID);
        expect(deps.peopleService.createEmployeeProfile).toHaveBeenCalled();
        expect(deps.leaveService.ensureEmployeeBalances).toHaveBeenCalledWith({
            authorization,
            employeeId: 'EMP-2',
            year: expect.any(Number),
            leaveTypes: ['annual'],
        });
    });

    it('updateEligibility updates profile and ensures balances with employee number', async () => {
        const { service, deps } = createService({
            peopleService: {
                getEmployeeProfile: vi.fn(async () => ({
                    profile: {
                        ...baseEmployeeProfile,
                    },
                })),
            },
        });

        await service.updateEligibility({
            authorization,
            profileId: PROFILE_ID,
            eligibleLeaveTypes: ['annual', 'sick'],
            year: 2025,
        });

        expect(deps.peopleService.updateEmployeeProfile).toHaveBeenCalledWith({
            authorization,
            payload: { profileId: PROFILE_ID, profileUpdates: { eligibleLeaveTypes: ['annual', 'sick'] } },
        });
        expect(deps.leaveService.ensureEmployeeBalances).toHaveBeenCalledWith({
            authorization,
            employeeId: 'EMP-1',
            year: 2025,
            leaveTypes: ['annual', 'sick'],
        });
    });

    it('terminateEmployee cancels pending leave and updates records', async () => {
        const { service, deps } = createService({
            peopleService: {
                getEmployeeProfile: vi.fn(async () => ({
                    profile: {
                        ...baseEmployeeProfile,
                        id: '55555555-5555-4555-8555-555555555555',
                    },
                })),
            },
            leaveService: {
                listLeaveRequests: vi.fn(async () => ({
                    requests: [buildLeaveRequest({ id: 'req-1' })],
                })),
                cancelLeaveRequest: vi.fn(async () => ({
                    success: true,
                    requestId: 'req-1',
                    cancelledAt: timestamp,
                } satisfies CancelLeaveRequestResult)),
                ensureEmployeeBalances: vi.fn(async () => ({
                    success: true,
                    employeeId: 'EMP-1',
                    year: 2025,
                    ensuredBalances: 0,
                } satisfies EnsureEmployeeBalancesResult)),
                getLeaveBalance: vi.fn(async () => ({
                    balances: [buildLeaveBalance()],
                    employeeId: 'EMP-1',
                    year: 2025,
                })),
            },
            absenceService: {
                listAbsences: vi.fn(async () => ({
                    absences: [buildAbsence({ id: 'abs-1', status: 'APPROVED' })],
                })),
                cancelAbsence: vi.fn(async () => ({
                    absence: buildAbsence({ id: 'abs-1', status: 'CANCELLED' }),
                })),
            },
        });

        await service.terminateEmployee({
            authorization,
            profileId: '55555555-5555-4555-8555-555555555555',
            termination: { reason: 'Reduction', date: new Date('2025-01-01') },
            cancelPendingLeave: true,
        });

        expect(deps.peopleService.updateEmployeeProfile).toHaveBeenCalled();
        expect(deps.leaveService.listLeaveRequests).toHaveBeenCalledWith({
            authorization,
            employeeId: 'EMP-1',
            filters: { status: 'submitted' },
        });
        expect(deps.leaveService.cancelLeaveRequest).toHaveBeenCalledWith({
            authorization,
            requestId: 'req-1',
            cancelledBy: authorization.userId,
            reason: 'Reduction',
        });
        expect(deps.absenceService.cancelAbsence).toHaveBeenCalledWith({
            authorization,
            absenceId: 'abs-1',
            payload: { reason: 'Reduction' },
        });
    });
});
