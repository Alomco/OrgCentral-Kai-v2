import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { PrismaEmployeeProfileRepository } from '@/server/repositories/prisma/hr/people/prisma-employee-profile-repository';
import { HR_PEOPLE_CACHE_SCOPES } from '@/server/lib/cache-tags/hr-people';

const baseRecord = {
  id: 'profile-1',
  orgId: 'org-1',
  userId: 'user-1',
  email: 'user@example.com',
  personalEmail: null,
  firstName: 'Test',
  lastName: 'User',
  displayName: 'Test User',
  photoUrl: null,
  phone: null,
  address: null,
  roles: [] as string[],
  eligibleLeaveTypes: [] as string[],
  employmentStatus: 'ACTIVE',
  employmentPeriods: null,
  salaryDetails: null,
  skills: [] as string[],
  certifications: null,
  employeeNumber: 'EN-1',
  jobTitle: null,
  employmentType: 'FULL_TIME',
  departmentId: null,
  startDate: new Date(),
  endDate: null,
  managerOrgId: 'org-1',
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
  healthStatus: 'UNDEFINED',
  workPermit: null,
  bankDetails: null,
  metadata: { existing: true } as Record<string, unknown>,
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createRepository() {
  const findUnique = vi.fn((args: unknown) => {
    const where = (args as { where?: Record<string, unknown> }).where ?? {};
    if ('id' in where && (where as { id?: string }).id === baseRecord.id) {
      return { ...baseRecord };
    }
    if ('orgId_userId' in where) {
      const composite = (where as { orgId_userId: { orgId: string; userId: string } }).orgId_userId;
      if (composite.orgId === baseRecord.orgId && composite.userId === baseRecord.userId) {
        return { ...baseRecord };
      }
    }
    if ('orgId_employeeNumber' in where) {
      const composite = (where as { orgId_employeeNumber: { orgId: string; employeeNumber: string } })
        .orgId_employeeNumber;
      if (composite.orgId === baseRecord.orgId && composite.employeeNumber === baseRecord.employeeNumber) {
        return { ...baseRecord };
      }
    }
    return null;
  });

  const findFirst = vi.fn((args: unknown) => {
    const where = (args as { where?: Record<string, unknown> }).where ?? {};
    if (where.orgId !== baseRecord.orgId) {
      return null;
    }
    const emailFilter = (where as { email?: { equals?: string } }).email;
    if (!emailFilter?.equals) {
      return null;
    }
    if (emailFilter.equals.toLowerCase() === baseRecord.email.toLowerCase()) {
      return { ...baseRecord };
    }
    return null;
  });

  const update = vi.fn((args: { data: Record<string, unknown> }) => {
    return { ...baseRecord, ...args.data };
  });

  const mockPrisma = {
    employeeProfile: {
      findUnique,
      findFirst,
      update,
    },
  } as unknown as PrismaClient;

  const onAfterWrite = vi.fn();
  const repo = new PrismaEmployeeProfileRepository({ prisma: mockPrisma, onAfterWrite });

  return { repo, findUnique, findFirst, update, onAfterWrite };
}

describe('PrismaEmployeeProfileRepository', () => {
  it('finds by org-scoped employee number', async () => {
    const { repo, findUnique } = createRepository();

    const profile = await repo.findByEmployeeNumber(baseRecord.orgId, baseRecord.employeeNumber);

    expect(profile?.employeeNumber).toBe(baseRecord.employeeNumber);
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        orgId_employeeNumber: {
          orgId: baseRecord.orgId,
          employeeNumber: baseRecord.employeeNumber,
        },
      },
    });
  });

  it('finds by email using case-insensitive match', async () => {
    const { repo, findFirst } = createRepository();

    const profile = await repo.findByEmail(baseRecord.orgId, baseRecord.email.toUpperCase());

    expect(profile?.email?.toLowerCase()).toBe(baseRecord.email);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        orgId: baseRecord.orgId,
        email: { equals: baseRecord.email.toUpperCase(), mode: 'insensitive' },
      },
    });
  });

  it('updates compliance status in metadata and invalidates cache', async () => {
    const { repo, update, onAfterWrite } = createRepository();

    await repo.updateComplianceStatus(baseRecord.orgId, baseRecord.id, 'EXPIRED');

    expect(update).toHaveBeenCalledTimes(1);
    const updateArguments = update.mock.calls[0][0];
    expect(updateArguments).toMatchObject({
      where: { orgId_userId: { orgId: baseRecord.orgId, userId: baseRecord.userId } },
    });
    expect(updateArguments.data.metadata).toMatchObject({
      existing: true,
      complianceStatus: 'EXPIRED',
    });
    expect(onAfterWrite).toHaveBeenCalledWith(baseRecord.orgId, [HR_PEOPLE_CACHE_SCOPES.profiles]);
  });
});
