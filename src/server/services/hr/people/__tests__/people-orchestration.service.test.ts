import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { LeaveServiceContract } from '@/server/services/hr/leave/leave-service.provider';
import type { AbsenceServiceContract } from '@/server/services/hr/absences/absence-service.provider';
import type { ComplianceStatusService } from '@/server/services/hr/compliance/compliance-status-service';
import type { MembershipServiceContract } from '@/server/services/org/membership/membership-service.provider';
import type { PeopleService } from '../people-service';
import type { ComplianceAssignmentServiceContract } from '../people-orchestration.deps';
import { PeopleOrchestrationService } from '../people-orchestration.service';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { LeaveBalance, LeaveRequest } from '@/server/types/leave-types';
import type { UnplannedAbsence } from '@/server/types/hr-ops-types';
import type {
    CancelLeaveRequestResult,
    EnsureEmployeeBalancesResult,
} from '@/server/use-cases/hr/leave';

vi.mock('../helpers/people-orchestration.helpers', () => ({
    registerSummaryCaches: vi.fn(),
    invalidateOnboardCaches: vi.fn(async () => undefined),
    invalidateEligibilityCaches: vi.fn(async () => undefined),
    invalidateTerminationCaches: vi.fn(async () => undefined),
    invalidateComplianceAssignmentCaches: vi.fn(async () => undefined),
    buildTelemetryMetadata: vi.fn((operation: string, _auth: RepositoryAuthorizationContext, metadata?: Record<string, unknown>) => ({
        auditSource: `service:hr:people.${operation}`,
        ...metadata,
    })),
}));

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_USER_ID = '33333333-3333-4333-8333-333333333333';
const PROFILE_ID = '44444444-4444-4444-8444-444444444444';
const CORRELATION_ID = '55555555-5555-4555-8555-555555555555';

const authorization: RepositoryAuthorizationContext = {
    orgId: ORG_ID,
    userId: USER_ID,
    roleKey: 'orgAdmin',
    permissions: {},
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    correlationId: CORRELATION_ID,
    auditSource: 'test',
    tenantScope: {
        orgId: ORG_ID,
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
        auditBatchId: undefined,
    },
};

const timestamp = '2025-01-01T00:00:00.000Z';

const buildLeaveRequest = (overrides: Partial<LeaveRequest> = {}): LeaveRequest => ({
    id: '66666666-6666-4666-8666-666666666666',
    orgId: ORG_ID,
    employeeId: 'EMP-1',
    userId: USER_ID,
    employeeName: 'Test User',
    leaveType: 'annual',
    startDate: '2025-01-10',
    endDate: '2025-01-12',
    totalDays: 3,
    isHalfDay: false,
    status: 'submitted',
    createdAt: timestamp,
    createdBy: USER_ID,
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    ...overrides,
});

const buildLeaveBalance = (overrides: Partial<LeaveBalance> = {}): LeaveBalance => ({
    id: '77777777-7777-4777-8777-777777777777',
    orgId: ORG_ID,
    employeeId: 'EMP-1',
    leaveType: 'annual',
    year: 2025,
    totalEntitlement: 20,
    used: 0,
    pending: 0,
    available: 20,
    createdAt: timestamp,
    updatedAt: timestamp,
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    ...overrides,
});

const buildAbsence = (overrides: Partial<UnplannedAbsence> = {}): UnplannedAbsence => ({
    id: 'abs-1',
    orgId: 'org-1',
    userId: 'user-1',
    typeId: 'type-1',
    startDate: new Date('2025-01-10T00:00:00.000Z'),
    endDate: new Date('2025-01-11T00:00:00.000Z'),
    hours: 8,
    status: 'APPROVED',
    dataClassification: 'OFFICIAL',
    residencyTag: 'UK_ONLY',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
});

const createService = (overrides?: Partial<{
    peopleService: Partial<PeopleService>;
    leaveService: Partial<LeaveServiceContract>;
    absenceService: Partial<AbsenceServiceContract>;
    complianceStatusService: Partial<ComplianceStatusService>;
    membershipService: Partial<MembershipServiceContract>;
    complianceAssignmentService: Partial<ComplianceAssignmentServiceContract>;
}>) => {
    const leaveRequest = buildLeaveRequest();
    const leaveBalance = buildLeaveBalance();
    const absence = buildAbsence();

    const peopleService = {
        createEmployeeProfile: vi.fn(async () => ({ profileId: PROFILE_ID })),
        createEmploymentContract: vi.fn(async () => ({ contractId: 'contract-1' })),
        updateEmployeeProfile: vi.fn(async () => ({})),
        updateEmploymentContract: vi.fn(async () => ({})),
        getEmployeeProfile: vi.fn(async () => ({ profile: { id: 'profile-1', userId: 'user-1', employeeNumber: 'EMP-1' } })),
        getEmploymentContractByEmployee: vi.fn(async () => ({ contract: { id: 'contract-1' } })),
        getEmployeeProfileByUser: vi.fn(async () => ({ profile: { id: 'profile-1', userId: 'user-1', employeeNumber: 'EMP-1' } })),
        ...overrides?.peopleService,
    } as unknown as PeopleService;

    const leaveService = {
        ensureEmployeeBalances: vi.fn(async () => ({
            success: true,
            employeeId: leaveRequest.employeeId,
            year: 2025,
            ensuredBalances: 0,
        } satisfies EnsureEmployeeBalancesResult)),
        getLeaveBalance: vi.fn(async () => ({
            balances: [leaveBalance],
            employeeId: leaveBalance.employeeId,
            year: leaveBalance.year,
        })),
        listLeaveRequests: vi.fn(async () => ({
            requests: [leaveRequest],
            employeeId: leaveRequest.employeeId,
        })),
        cancelLeaveRequest: vi.fn(async () => ({
            success: true,
            requestId: leaveRequest.id,
            cancelledAt: timestamp,
        } satisfies CancelLeaveRequestResult)),
        ...overrides?.leaveService,
    } as LeaveServiceContract;

    const absenceService = {
        listAbsences: vi.fn(async () => ({ absences: [absence] })),
        cancelAbsence: vi.fn(async () => ({ absence })),
        ...overrides?.absenceService,
    } as unknown as AbsenceServiceContract;

    const complianceStatusService = {
        getStatusForUser: vi.fn(async () => null),
        ...overrides?.complianceStatusService,
    } as unknown as ComplianceStatusService;

    const membershipService = {
        acceptInvitation: vi.fn(async () => ({ status: 'ok' })),
        ...overrides?.membershipService,
    } as unknown as MembershipServiceContract;

    const complianceAssignmentService: ComplianceAssignmentServiceContract = {
        assignCompliancePack: vi.fn(async () => undefined),
        ...overrides?.complianceAssignmentService,
    };

    const service = new PeopleOrchestrationService({
        peopleService,
        leaveService,
        absenceService,
        complianceStatusService,
        membershipService,
        complianceAssignmentService,
    });

    // Bypass guard and logger wrappers for unit-level tests.
    const serviceBypass = service as unknown as {
        ensureOrgAccess: () => Promise<void>;
        executeInServiceContext: (_ctx: unknown, _op: string, handler: () => Promise<unknown>) => Promise<unknown>;
    };
    serviceBypass.ensureOrgAccess = async () => undefined;
    serviceBypass.executeInServiceContext = async (_ctx: unknown, _op: string, handler: () => Promise<unknown>) => handler();

    return { service, deps: { peopleService, leaveService, absenceService, complianceStatusService, membershipService } };
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
        const { service, deps } = createService();

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
