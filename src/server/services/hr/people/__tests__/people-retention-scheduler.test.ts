import { describe, expect, it, vi } from 'vitest';
import { PeopleRetentionScheduler } from '../sar/people-retention-scheduler';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import type { RetentionJobQueue } from '../sar/people-retention-scheduler';

const authorization: RepositoryAuthorizationContext = {
  orgId: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000002',
  roleKey: 'owner',
  dataResidency: 'UK_ONLY',
  dataClassification: 'OFFICIAL',
  auditSource: 'test',
  correlationId: '00000000-0000-0000-0000-000000000099',
  tenantScope: {
    orgId: '00000000-0000-0000-0000-000000000001',
    dataResidency: 'UK_ONLY',
    dataClassification: 'OFFICIAL',
    auditSource: 'test',
  },
};

function profileRepoWithData(data: EmployeeProfileDTO[]): IEmployeeProfileRepository {
  return {
    createEmployeeProfile: async () => { },
    updateEmployeeProfile: vi.fn().mockResolvedValue(undefined),
    getEmployeeProfile: async () => null,
    getEmployeeProfileByUser: async () => null,
    getEmployeeProfilesByOrganization: async () => data,
    findByEmployeeNumber: async () => null,
    findByEmail: async () => null,
    updateComplianceStatus: async () => { },
    deleteEmployeeProfile: async () => { },
    linkProfileToUser: async () => { },
  };
}

function contractRepoWithData(data: EmploymentContractDTO[]): IEmploymentContractRepository {
  return {
    createEmploymentContract: async () => { },
    updateEmploymentContract: vi.fn().mockResolvedValue(undefined),
    getEmploymentContract: async () => null,
    getEmploymentContractByEmployee: async () => null,
    getEmploymentContractsByOrganization: async () => data,
    deleteEmploymentContract: async () => { },
  };
}

describe('PeopleRetentionScheduler', () => {
  it('schedules soft delete for expired records and emits audit', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
    const queue: RetentionJobQueue = {
      enqueueProfileSoftDelete: vi.fn().mockResolvedValue(undefined),
      enqueueContractSoftDelete: vi.fn().mockResolvedValue(undefined),
    };

    const profiles: EmployeeProfileDTO[] = [
      {
        id: 'profile-1',
        orgId: authorization.orgId,
        userId: 'user-1',
        employeeNumber: 'E-1',
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        jobTitle: 'Engineer',
        departmentId: null,
        startDate: new Date('2024-01-01'),
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
        niNumber: null,
        emergencyContact: null,
        nextOfKin: null,
        healthStatus: 'FIT_FOR_WORK',
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
        dataClassification: 'OFFICIAL_SENSITIVE',
        auditSource: 'service',
        correlationId: null,
        schemaVersion: 1,
        createdBy: null,
        updatedBy: null,
        retentionPolicy: 'keep-1y',
        retentionExpiresAt: new Date('2020-01-01'),
        erasureRequestedAt: null,
        erasureCompletedAt: null,
        erasureReason: null,
        erasureActorOrgId: null,
        erasureActorUserId: null,
        archivedAt: null,
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        personalEmail: null,
        email: null,
        displayName: null,
        photoUrl: null,
      },
    ];

    const contracts: EmploymentContractDTO[] = [
      {
        id: 'contract-1',
        orgId: authorization.orgId,
        userId: 'user-1',
        contractType: 'PERMANENT',
        startDate: new Date('2024-01-01'),
        endDate: null,
        jobTitle: 'Engineer',
        departmentId: null,
        location: null,
        probationEndDate: null,
        furloughStartDate: null,
        furloughEndDate: null,
        workingPattern: null,
        benefits: null,
        terminationReason: null,
        terminationNotes: null,
        archivedAt: null,
        deletedAt: null,
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'service',
        correlationId: null,
        schemaVersion: 1,
        createdBy: null,
        updatedBy: null,
        retentionPolicy: 'keep-1y',
        retentionExpiresAt: new Date('2020-01-01'),
        erasureRequestedAt: null,
        erasureCompletedAt: null,
        erasureReason: null,
        erasureActorOrgId: null,
        erasureActorUserId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const profileRepo = profileRepoWithData(profiles);
    const contractRepo = contractRepoWithData(contracts);

    const scheduler = new PeopleRetentionScheduler({
      profileRepo,
      contractRepo,
      queue,
      auditLogger,
      now: () => new Date('2025-01-01'),
    });

    const result = await scheduler.sweepExpired(authorization, authorization.correlationId);

    expect(result.profilesScheduled).toBe(1);
    expect(result.contractsScheduled).toBe(1);
    expect((profileRepo.updateEmployeeProfile as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect((contractRepo.updateEmploymentContract as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    expect(queue.enqueueProfileSoftDelete).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'profile-1', dataClassification: 'OFFICIAL_SENSITIVE' }),
    );
    expect(queue.enqueueContractSoftDelete).toHaveBeenCalledWith(
      expect.objectContaining({ recordId: 'contract-1' }),
    );
    expect(auditLogger).toHaveBeenCalled();
  });

  it('ignores records not yet expired or already erased', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
    const profileRepo = profileRepoWithData([
      {
        id: 'profile-future',
        orgId: authorization.orgId,
        userId: 'user-future',
        employeeNumber: 'E-2',
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        jobTitle: 'Engineer',
        departmentId: null,
        startDate: new Date('2024-01-01'),
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
        niNumber: null,
        emergencyContact: null,
        nextOfKin: null,
        healthStatus: 'FIT_FOR_WORK',
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
        auditSource: 'service',
        correlationId: null,
        schemaVersion: 1,
        createdBy: null,
        updatedBy: null,
        retentionPolicy: 'keep-1y',
        retentionExpiresAt: new Date('2099-01-01'),
        erasureRequestedAt: null,
        erasureCompletedAt: new Date(),
        erasureReason: null,
        erasureActorOrgId: null,
        erasureActorUserId: null,
        archivedAt: null,
        deletedAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        personalEmail: null,
        email: null,
        displayName: null,
        photoUrl: null,
      },
    ]);

    const scheduler = new PeopleRetentionScheduler({
      profileRepo,
      contractRepo: contractRepoWithData([]),
      auditLogger,
      now: () => new Date('2025-01-01'),
    });

    const result = await scheduler.sweepExpired(authorization, authorization.correlationId);

    expect(result.profilesScheduled).toBe(0);
    expect(auditLogger).not.toHaveBeenCalled();
  });
});
