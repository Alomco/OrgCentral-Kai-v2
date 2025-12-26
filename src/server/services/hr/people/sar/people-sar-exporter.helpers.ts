import { Readable } from 'node:stream';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import type { AuditEventPayload } from '@/server/logging/audit-logger';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import type { RedactedExportRow, SarCsvOptions } from './people-sar-exporter.types';
import { registerPeopleContractsTag, registerPeopleProfilesTag } from '@/server/lib/cache-tags/hr-people';

export const AUDIT_ACTION_EXPORT = 'export.sar' as const;
export const AUDIT_ACTION_SKIP = 'export.sar.skip' as const;
export const AUDIT_RESOURCE_PROFILE = 'hr.people.profile' as const;
export const AUDIT_RESOURCE_CONTRACT = 'hr.people.contract' as const;
export const SKIP_REASON_ERASURE = 'erasureCompletedAt' as const;
export const SKIP_REASON_RETENTION = 'retentionExpired' as const;
export const EXPORT_ROW_PROFILE = 'profile' as const;
export const EXPORT_ROW_CONTRACT = 'contract' as const;
export const CSV_HEADER_FIELDS = [
  'resource', 'id', 'orgId', 'userId', 'employeeNumber', 'employmentType', 'employmentStatus',
  'contractType', 'jobTitle', 'departmentId', 'startDate', 'endDate', 'location', 'costCenter',
  'salaryAmount', 'salaryCurrency', 'salaryFrequency', 'retentionPolicy', 'retentionExpiresAt',
  'erasureRequestedAt', 'erasureCompletedAt', 'dataResidency', 'dataClassification', 'correlationId',
  'auditSource',
] as const;

interface AuditArguments {
  authorization: RepositoryAuthorizationContext;
  record: EmployeeProfileDTO | EmploymentContractDTO;
  resource: 'hr.people.profile' | 'hr.people.contract';
  action: 'export.sar' | 'export.sar.skip';
  redactedFields?: string[];
  correlationId?: string;
  reason?: string;
  auditSource?: string;
}

function safeRegisterTag(
  register: (payload: Parameters<typeof registerPeopleProfilesTag>[0]) => void,
  payload: Parameters<typeof registerPeopleProfilesTag>[0],
): void {
  try {
    register(payload);
  } catch {
    // Cache registration is best-effort for export contexts
  }
}

export function registerProfileCacheTags(
  authorization: RepositoryAuthorizationContext,
  profiles: EmployeeProfileDTO[],
): void {
  profiles.forEach((profile) => {
    const classification = profile.dataClassification ?? authorization.dataClassification;
    const residency = profile.dataResidency ?? authorization.dataResidency;
    safeRegisterTag(registerPeopleProfilesTag, {
      orgId: profile.orgId,
      classification,
      residency,
    });
  });
}

export function registerContractCacheTags(
  authorization: RepositoryAuthorizationContext,
  contracts: EmploymentContractDTO[],
): void {
  contracts.forEach((contract) => {
    const classification = contract.dataClassification ?? authorization.dataClassification;
    const residency = contract.dataResidency ?? authorization.dataResidency;
    safeRegisterTag(registerPeopleContractsTag, {
      orgId: contract.orgId,
      classification,
      residency,
    });
  });
}

export function toAuditPayload(args: AuditArguments): AuditEventPayload {
  const dataResidency = args.record.dataResidency ?? args.authorization.dataResidency;
  const dataClassification = args.record.dataClassification ?? args.authorization.dataClassification;
  return {
    orgId: args.authorization.orgId,
    userId: args.authorization.userId,
    eventType: 'DATA_CHANGE',
    action: args.action,
    resource: args.resource,
    resourceId: args.record.id,
    correlationId: args.correlationId ?? args.authorization.correlationId,
    residencyZone: dataResidency,
    classification: dataClassification,
    auditSource: args.auditSource ?? args.authorization.auditSource,
    payload: {
      redactedFields: args.redactedFields ?? [],
      reason: args.reason,
      retentionExpiresAt: args.record.retentionExpiresAt ?? null,
      erasureCompletedAt: args.record.erasureCompletedAt ?? null,
    },
  };
}

export function toIso(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function escapeCsvValue(raw: string, quote: string): string {
  const escaped = raw.replace(new RegExp(quote, 'g'), `${quote}${quote}`);
  return /[",\n\r]/.test(raw) ? `${quote}${escaped}${quote}` : escaped;
}

function formatCsvValue(value: unknown, quote: string): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'object') {
    const serialized = JSON.stringify(value);
    return serialized ? escapeCsvValue(serialized, quote) : '';
  }
  if (
    typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || typeof value === 'bigint'
  ) {
    return escapeCsvValue(String(value), quote);
  }
  return '';
}

export function buildCsv(rows: RedactedExportRow[], options?: SarCsvOptions): Readable {
  const delimiter = options?.delimiter ?? ',';
  const quote = options?.quote ?? '"';

  const lines = rows.map((row) => {
    const record = (row as unknown) as Record<string, unknown>;
    return CSV_HEADER_FIELDS
      .map((key) => formatCsvValue(record[key], quote))
      .join(delimiter);
  });

  return Readable.from([
    `${CSV_HEADER_FIELDS.join(delimiter)}\n`,
    ...lines.map((line) => `${line}\n`),
  ]);
}

export function buildJsonl(rows: RedactedExportRow[]): Readable {
  const lines = rows.map((row) => `${JSON.stringify(row)}\n`);
  return Readable.from(lines);
}
