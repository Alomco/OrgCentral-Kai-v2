import { describe, it, expect } from 'vitest';
import { Prisma } from '../../../../../../generated/client';
import type { EmployeeProfile as PrismaEmployeeProfile } from '../../../../../../generated/client';
import { mapPrismaEmployeeProfileToDomain, mapDomainEmployeeProfileToPrisma } from '../employee-profile-mapper';

const baseRecord: PrismaEmployeeProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  orgId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  firstName: null,
  lastName: null,
  displayName: null,
  photoUrl: null,
  email: null,
  personalEmail: null,
  employeeNumber: 'E-1',
  jobTitle: null,
  employmentType: 'FULL_TIME',
  employmentStatus: 'ACTIVE',
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
  phone: null,
  address: null,
  roles: [],
  eligibleLeaveTypes: [],
  employmentPeriods: null,
  salaryDetails: null,
  skills: [],
  certifications: null,
  niNumber: null,
  emergencyContact: null,
  nextOfKin: null,
  healthStatus: 'UNDEFINED',
  workPermit: null,
  bankDetails: null,
  metadata: null,
  departmentId: null,
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
  archivedAt: null,
  deletedAt: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const LEGACY_EMAIL = 'u@example.com';
const LEGACY_FIRST_NAME = 'Jane';
const LEGACY_ROLE = 'member';

describe('employee-profile-mapper legacy metadata', () => {
  it('extracts legacyProfile fields from metadata', () => {
    const legacyProfile = {
      email: LEGACY_EMAIL,
      firstName: LEGACY_FIRST_NAME,
      lastName: 'Doe',
      roles: [LEGACY_ROLE],
    };
    const record = {
      ...baseRecord,
      metadata: {
        legacyProfile,
      },
    } as PrismaEmployeeProfile;

    const domain = mapPrismaEmployeeProfileToDomain(record);

    expect(domain.email).toBe(LEGACY_EMAIL);
    expect(domain.firstName).toBe(LEGACY_FIRST_NAME);
    expect(domain.roles).toEqual([LEGACY_ROLE]);
  });

  it('merges legacy fields back into metadata on write', () => {
    const baseDomain = mapPrismaEmployeeProfileToDomain(baseRecord);
    const prismaInput = mapDomainEmployeeProfileToPrisma({
      ...baseDomain,
      email: LEGACY_EMAIL,
      firstName: LEGACY_FIRST_NAME,
      roles: [LEGACY_ROLE],
    });

    const metadata = prismaInput.metadata as Prisma.JsonValue | null;
    expect(metadata).toBe(Prisma.JsonNull);
  });
});
