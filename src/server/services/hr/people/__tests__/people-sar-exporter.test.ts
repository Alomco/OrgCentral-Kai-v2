import { describe, expect, it, vi } from 'vitest';
import { PeopleSarExporter } from '../sar/people-sar-exporter';
import type { PeopleSarExportDependencies } from '../sar/people-sar-exporter.types';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import {
  authorization,
  buildContract,
  buildContractRepo,
  buildProfile,
  buildProfileRepo,
  readStream,
} from './people-sar-exporter.fixtures';

describe('PeopleSarExporter', () => {
  it('redacts sensitive profile fields and exports JSONL', async () => {
    const auditLogger = vi.fn().mockResolvedValue(undefined);
    const profiles: EmployeeProfileDTO[] = [
      buildProfile({
        salaryAmount: 100000,
        salaryCurrency: 'GBP',
        salaryFrequency: 'ANNUALLY',
        niNumber: 'NI-SECRET',
        workPermit: { id: 'permit' },
        bankDetails: { iban: 'secret' },
        metadata: { healthData: { status: 'ok' }, salaryConfidential: true },
        salaryDetails: { amount: 5000, currency: 'GBP' },
        auditSource: 'service',
        correlationId: 'corr-1',
      }),
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
      buildProfile({
        retentionExpiresAt: new Date('2020-01-01'),
      }),
      buildProfile({
        id: 'profile-2',
        userId: 'user-2',
        employeeNumber: 'E-2',
        erasureCompletedAt: new Date(),
      }),
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
      buildProfile({
        jobTitle: 'Engineer, Principal',
      }),
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
      buildContract({
        dataClassification: 'OFFICIAL_SENSITIVE',
        auditSource: 'contract-service',
        correlationId: 'corr-1',
      }),
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
