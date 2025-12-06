import { Readable } from 'node:stream';
import { describe, expect, it, vi } from 'vitest';
import { PeopleSarExporter } from '../sar/people-sar-exporter';
import type { PeopleSarExportDependencies } from '../sar/people-sar-exporter.types';
import type { IEmployeeProfileRepository } from '@/server/repositories/contracts/hr/people/employee-profile-repository-contract';
import type { IEmploymentContractRepository } from '@/server/repositories/contracts/hr/people/employment-contract-repository-contract';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';

function buildProfileRepo(profiles: EmployeeProfileDTO[]): IEmployeeProfileRepository {
  return {
    createEmployeeProfile: async () => { },
    updateEmployeeProfile: async () => { },
    getEmployeeProfile: async () => null,
    getEmployeeProfileByUser: async () => null,
    getEmployeeProfilesByOrganization: async () => profiles,
    findByEmployeeNumber: async () => null,
    findByEmail: async () => null,
    updateComplianceStatus: async () => { },
    deleteEmployeeProfile: async () => { },
    linkProfileToUser: async () => { },
  };
}

function buildContractRepo(contracts: EmploymentContractDTO[]): IEmploymentContractRepository {
  return {
    createEmploymentContract: async () => { },
    updateEmploymentContract: async () => { },
    getEmploymentContract: async () => null,
    getEmploymentContractByEmployee: async () => null,
    getEmploymentContractsByOrganization: async () => contracts,
    deleteEmploymentContract: async () => { },
  };
}

async function readStream(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

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

describe('PeopleSarExporter', () => {
  it('redacts sensitive profile fields and exports JSONL', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
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
        salaryAmount: 100000,
        salaryCurrency: 'GBP',
        salaryFrequency: 'ANNUALLY',
        salaryBasis: null,
        paySchedule: null,
        costCenter: null,
        location: null,
        niNumber: 'NI-SECRET',
        emergencyContact: null,
        nextOfKin: null,
        healthStatus: 'FIT_FOR_WORK',
        workPermit: { id: 'permit' },
        bankDetails: { iban: 'secret' },
        metadata: { healthData: { status: 'ok' }, salaryConfidential: true },
        phone: null,
        address: null,
        roles: [],
        eligibleLeaveTypes: [],
        employmentPeriods: null,
        salaryDetails: { amount: 5000, currency: 'GBP' },
        skills: null,
        certifications: null,
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        auditSource: 'service',
        correlationId: 'corr-1',
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
      },
    ];

    const deps: PeopleSarExportDependencies = {
      profileRepo: buildProfileRepo(profiles),
      contractRepo: buildContractRepo([]),
      auditLogger,
    };
    const exporter = new PeopleSarExporter(deps);

    const { stream } = await exporter.exportPeople(authorization, { format: 'jsonl' });
    const output = await readStream(stream);

    expect(output).toContain('"employmentType":"FULL_TIME"');
    expect(output).not.toContain('NI-SECRET');
    expect(output).not.toContain('healthData');
    expect(output).not.toContain('bankDetails');
    expect(output).not.toContain('salaryDetails');
    expect(output).not.toContain('salaryCurrency":"GBP"'); // confidential salary removed
    expect(auditLogger).toHaveBeenCalled();
  });

  it('skips erasure and retention expired records and audits skips', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
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
        salaryAmount: 100000,
        salaryCurrency: 'GBP',
        salaryFrequency: 'ANNUALLY',
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
      {
        id: 'profile-2',
        orgId: authorization.orgId,
        userId: 'user-2',
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
        salaryAmount: 100000,
        salaryCurrency: 'GBP',
        salaryFrequency: 'ANNUALLY',
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
    ];

    const exporter = new PeopleSarExporter({
      profileRepo: buildProfileRepo(profiles),
      contractRepo: buildContractRepo([]),
      auditLogger,
      now: () => new Date('2025-01-01'),
    });

    const result = await exporter.exportPeople(authorization, { format: 'jsonl' });
    const content = await readStream(result.stream);

    expect(result.counts.profiles).toBe(0);
    expect(result.counts.skipped).toBe(2);
    expect(content.trim()).toBe('');
    const auditActions = auditLogger.mock.calls.map((call) => call[0].action);
    expect(auditActions).toContain('export.sar.skip');
  });

  it('respects custom CSV delimiter/quote and escapes values', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
    const profiles: EmployeeProfileDTO[] = [
      {
        id: 'profile-1',
        orgId: authorization.orgId,
        userId: 'user-1',
        employeeNumber: 'E-1',
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        jobTitle: 'Engineer, Principal',
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
      },
    ];

    const exporter = new PeopleSarExporter({
      profileRepo: buildProfileRepo(profiles),
      contractRepo: buildContractRepo([]),
      auditLogger,
    });

    const { stream } = await exporter.exportPeople(authorization, {
      format: 'csv',
      csvOptions: { delimiter: ';', quote: '\'' },
    });
    const output = await readStream(stream);

    expect(output).toContain('Engineer, Principal');
    expect(output.split('\n')[0]).toContain(';'); // header uses delimiter
    expect(output).toMatch(/'Engineer, Principal'/);
  });

  it('includes classification/residency in audit payloads', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
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
        dataClassification: 'OFFICIAL_SENSITIVE',
        auditSource: 'contract-service',
        correlationId: 'corr-1',
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
      },
    ];

    const exporter = new PeopleSarExporter({
      profileRepo: buildProfileRepo([]),
      contractRepo: buildContractRepo(contracts),
      auditLogger,
    });

    await exporter.exportPeople(authorization, { format: 'jsonl', includeProfiles: false });

    const auditPayload = auditLogger.mock.calls[0][0];
    expect(auditPayload.classification).toBe('OFFICIAL_SENSITIVE');
    expect(auditPayload.residencyZone).toBe('UK_ONLY');
    expect(auditPayload.correlationId).toBe(authorization.correlationId);
  });
});
