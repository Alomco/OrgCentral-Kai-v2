import { describe, expect, it, vi } from 'vitest';
import { PeopleRetentionScheduler } from '../sar/people-retention-scheduler';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import type { RetentionJobQueue } from '../sar/people-retention-scheduler';
import { authorization, buildContract, buildProfile } from './people-sar-exporter.fixtures';

function profileRepoWithData(data: EmployeeProfileDTO[]): IEmployeeProfileRepository {
  return {
    createEmployeeProfile: async () => { },
    updateEmployeeProfile: vi.fn().mockResolvedValue(undefined),
    getEmployeeProfile: async () => null,
    getEmployeeProfileByUser: async () => null,
    getEmployeeProfilesByOrganization: async () => data,
    countEmployeeProfilesByOrganization: async () => data.length,
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
      buildProfile({
        dataClassification: 'OFFICIAL_SENSITIVE',
        auditSource: 'service',
        retentionPolicy: 'keep-1y',
        retentionExpiresAt: new Date('2020-01-01'),
      }),
    ];

    const contracts: EmploymentContractDTO[] = [
      buildContract({
        auditSource: 'service',
        retentionPolicy: 'keep-1y',
        retentionExpiresAt: new Date('2020-01-01'),
      }),
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
      buildProfile({
        id: 'profile-future',
        userId: 'user-future',
        employeeNumber: 'E-2',
        auditSource: 'service',
        retentionPolicy: 'keep-1y',
        retentionExpiresAt: new Date('2099-01-01'),
        erasureCompletedAt: new Date(),
      }),
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
