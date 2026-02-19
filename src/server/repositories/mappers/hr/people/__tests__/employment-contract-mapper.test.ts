import { describe, it, expect } from 'vitest';
import { Prisma, type EmploymentContract as PrismaEmploymentContract } from '@prisma/client';
import {
  mapPrismaEmploymentContractToDomain,
  mapDomainEmploymentContractToPrisma,
  mapDomainEmploymentContractToPrismaUpdate,
} from '../employment-contract-mapper';
import type { EmploymentContract } from '@/server/types/hr-types';
import { CONTRACT_TYPE_VALUES } from '@/server/types/hr/people';

describe('employment-contract mapper', () => {
  it('maps domain contract to prisma payload for create', () => {
    const now = new Date();
    const domain: EmploymentContract = {
      id: 'c1',
      orgId: 'org1',
      userId: 'user1',
      contractType: CONTRACT_TYPE_VALUES[0],
      startDate: now.toISOString(),
      endDate: null,
      jobTitle: 'Developer',
      departmentId: null,
      location: 'Remote',
      probationEndDate: null,
      furloughStartDate: null,
      furloughEndDate: null,
      workingPattern: null,
      benefits: null,
      terminationReason: null,
      terminationNotes: null,
      archivedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const prismaInput = mapDomainEmploymentContractToPrisma(domain);
    expect(prismaInput.contractType).toEqual(CONTRACT_TYPE_VALUES[0]);
    expect(prismaInput.startDate).toBeInstanceOf(Date);
    expect(prismaInput.location).toEqual('Remote');
  });

  it('maps prisma record to domain DTO', () => {
    const record: PrismaEmploymentContract = {
      id: 'c2',
      orgId: 'org2',
      userId: 'u2',
      contractType: 'CONSULTANT',
      startDate: new Date('2024-01-01'),
      endDate: null,
      jobTitle: 'Consultant',
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
      dataClassification: 'OFFICIAL',
      residencyTag: 'UK_ONLY',
      auditSource: null,
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
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-03'),
    };

    const domain = mapPrismaEmploymentContractToDomain(record);
    expect(domain.contractType).toEqual('CONSULTANT');
    expect(domain.orgId).toEqual('org2');
  });

  it('builds prisma update payload safely', () => {
    const updatePayload = mapDomainEmploymentContractToPrismaUpdate({
      endDate: '2024-12-31T00:00:00.000Z',
      probationEndDate: null,
    } as Partial<EmploymentContract>);

    expect(updatePayload.endDate).toBeInstanceOf(Date);
    expect(updatePayload.probationEndDate).toBeNull();
  });
});
