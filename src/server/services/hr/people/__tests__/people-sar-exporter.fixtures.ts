import { Readable } from 'node:stream';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';

export const authorization: RepositoryAuthorizationContext = {
  orgId: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000002',
  roleKey: 'owner',
  permissions: {},
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

const baseProfile: EmployeeProfileDTO = {
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
  dataClassification: 'OFFICIAL',
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  personalEmail: null,
  email: null,
  displayName: null,
  photoUrl: null,
};

const baseContract: EmploymentContractDTO = {
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export function buildProfile(overrides: Partial<EmployeeProfileDTO>): EmployeeProfileDTO {
  return { ...baseProfile, ...overrides };
}

export function buildContract(overrides: Partial<EmploymentContractDTO>): EmploymentContractDTO {
  return { ...baseContract, ...overrides };
}

export function buildProfileRepo(profiles: EmployeeProfileDTO[]): IEmployeeProfileRepository {
  return {
    createEmployeeProfile: async () => { },
    updateEmployeeProfile: async () => { },
    getEmployeeProfile: async () => null,
    getEmployeeProfileByUser: async () => null,
    getEmployeeProfilesByOrganization: async () => profiles,
    countEmployeeProfilesByOrganization: async () => profiles.length,
    findByEmployeeNumber: async () => null,
    findByEmail: async () => null,
    updateComplianceStatus: async () => { },
    deleteEmployeeProfile: async () => { },
    linkProfileToUser: async () => { },
  };
}

export function buildContractRepo(contracts: EmploymentContractDTO[]): IEmploymentContractRepository {
  return {
    createEmploymentContract: async () => { },
    updateEmploymentContract: async () => { },
    getEmploymentContract: async () => null,
    getEmploymentContractByEmployee: async () => null,
    getEmploymentContractsByOrganization: async () => contracts,
    deleteEmploymentContract: async () => { },
  };
}

export async function readStream(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
