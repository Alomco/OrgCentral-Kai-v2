import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { ValidationError } from '@/server/errors';
import {
    ensureEmployeeByEmployeeNumber,
    resolveEmployeeFromProfile,
    sendCancelNotification,
} from '@/server/services/hr/leave/leave-service.helpers';
import { emitHrNotification } from '@/server/use-cases/hr/notifications/notification-emitter';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { EmployeeProfileDTO } from '@/server/types/hr/people';

vi.mock('@/server/use-cases/hr/notifications/notification-emitter', () => ({
    emitHrNotification: vi.fn().mockResolvedValue(undefined),
}));

const authorization: RepositoryAuthorizationContext = {
    orgId: 'org-1',
    userId: 'admin-1',
    roleKey: 'orgAdmin',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
    tenantScope: {
        orgId: 'org-1',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
        auditBatchId: undefined,
    },
    correlationId: 'corr-1',
};

const emitHrNotificationMock = emitHrNotification as unknown as ReturnType<typeof vi.fn>;

function buildProfile(overrides: Partial<EmployeeProfileDTO>): EmployeeProfileDTO {
    return {
        id: 'profile-1',
        orgId: 'org-1',
        userId: 'user-1',
        employeeNumber: 'EMP-1',
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        healthStatus: 'UNDEFINED',
        jobTitle: null,
        departmentId: null,
        startDate: null,
        endDate: null,
        managerOrgId: null,
        managerUserId: null,
        annualSalary: null,
        hourlyRate: null,
        salaryAmount: null,
        salaryCurrency: null,
        salaryFrequency: null,
        salaryBasis: null,
        paySchedule: null,
        costCenter: null,
        location: null,
        photoUrl: null,
        niNumber: null,
        emergencyContact: null,
        nextOfKin: null,
        workPermit: null,
        bankDetails: null,
        metadata: null,
        phone: null,
        address: null,
        roles: [],
        eligibleLeaveTypes: [],
        employmentPeriods: null,
        salaryDetails: null,
        skills: null,
        certifications: null,
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'test',
        correlationId: null,
        schemaVersion: 1,
        createdBy: null,
        updatedBy: null,
        retentionPolicy: null,
        retentionExpiresAt: null,
        erasureRequestedAt: null,
        erasureCompletedAt: null,
        erasureReason: null,
        erasureActorOrgId: null,
        erasureActorUserId: null,
        archivedAt: null,
        deletedAt: null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        ...overrides,
    };
}

function createProfileRepoMock(profile: EmployeeProfileDTO | null): IEmployeeProfileRepository {
    return {
        findByEmployeeNumber: vi.fn(async () => profile),
        findByEmail: vi.fn(async () => profile),
        getEmployeeProfileByUser: vi.fn(async () => profile),
        createEmployeeProfile: vi.fn(async () => undefined),
        updateEmployeeProfile: vi.fn(async () => undefined),
        getEmployeeProfile: vi.fn(async () => profile),
        getEmployeeProfilesByOrganization: vi.fn(async () => []),
        deleteEmployeeProfile: vi.fn(async () => undefined),
        updateComplianceStatus: vi.fn(async () => undefined),
        linkProfileToUser: vi.fn(async () => undefined),
    };
}

const logger = {
    warn: vi.fn(),
    error: vi.fn(),
};

describe('leave-service.helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('resolves employee from profile and returns normalized name', async () => {
        const profileRepo = createProfileRepoMock(buildProfile({ displayName: 'Test User' }));

        const result = await resolveEmployeeFromProfile(profileRepo as any, authorization, 'user-1', 'EMP-1');

        expect(result).toEqual({ employeeId: 'EMP-1', employeeName: 'Test User' });
        expect(profileRepo.getEmployeeProfileByUser).toHaveBeenCalledWith('org-1', 'user-1');
    });

    it('throws when submitted employeeId mismatches profile', async () => {
        const profileRepo = createProfileRepoMock(buildProfile({ displayName: 'Test User' }));

        await expect(
            resolveEmployeeFromProfile(profileRepo as any, authorization, 'user-1', 'EMP-2'),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it('ensures employee by employeeNumber', async () => {
        const profileRepo = createProfileRepoMock(buildProfile({}));

        const profile = await ensureEmployeeByEmployeeNumber(profileRepo as any, 'org-1', 'EMP-1');

        expect(profile).toMatchObject({ employeeNumber: 'EMP-1' });
        expect(profileRepo.findByEmployeeNumber).toHaveBeenCalledWith('org-1', 'EMP-1');
    });

    it('sends cancel notification when userId is present', async () => {
        await sendCancelNotification(
            authorization,
            {
                userId: 'user-1',
                requestId: 'req-1',
                leaveType: 'annual',
                totalDays: 2,
                startDate: '2025-01-01',
                endDate: '2025-01-02',
                employeeId: 'EMP-1',
                reason: 'User cancelled',
            },
            {} as any,
            logger,
        );

        expect(emitHrNotificationMock).toHaveBeenCalledTimes(1);
        const payload = emitHrNotificationMock.mock.calls[0]?.[0];
        expect(payload?.service).toBeDefined();
    });

    it('skips cancel notification when userId is missing', async () => {
        await sendCancelNotification(
            authorization,
            {
                userId: null,
                requestId: 'req-2',
                leaveType: 'annual',
                totalDays: 1,
                startDate: '2025-01-01',
                endDate: '2025-01-01',
                employeeId: 'EMP-1',
            },
            {} as any,
            logger,
        );

        expect(logger.warn).toHaveBeenCalled();
        expect(emitHrNotificationMock).not.toHaveBeenCalled();
    });
});
