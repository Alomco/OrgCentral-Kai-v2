import { Readable } from 'node:stream';
import { sarExportOptionsSchema } from './people-sar-exporter.schemas';
import {
  type PeopleSarExportDependencies,
  type PeopleSarExportOptions,
  type PeopleSarExportResponse,
  type RedactedExportRow,
  type SarExportPort,
  type SarCsvOptions,
} from './people-sar-exporter.types';
import { isRetentionExpired, redactContract, redactProfile, shouldOmitForErasure } from './people-sar-exporter.redaction';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import type { AuditEventPayload } from '@/server/logging/audit-logger';
import type { EmployeeProfileDTO, EmploymentContractDTO } from '@/server/types/hr/people';
import { registerPeopleContractsTag, registerPeopleProfilesTag } from '@/server/lib/cache-tags/hr-people';

const AUDIT_ACTION_EXPORT = 'export.sar' as const;
const AUDIT_ACTION_SKIP = 'export.sar.skip' as const;
const AUDIT_RESOURCE_PROFILE = 'hr.people.profile' as const;
const AUDIT_RESOURCE_CONTRACT = 'hr.people.contract' as const;
const SKIP_REASON_ERASURE = 'erasureCompletedAt' as const;
const SKIP_REASON_RETENTION = 'retentionExpired' as const;
const EXPORT_ROW_PROFILE = 'profile' as const;
const EXPORT_ROW_CONTRACT = 'contract' as const;
const CSV_HEADER_FIELDS = [
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

function toAuditPayload(args: AuditArguments): AuditEventPayload {
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

function toIso(value: string | Date | null | undefined): string | null {
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
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return escapeCsvValue(String(value), quote);
  }
  return '';
}

function buildCsv(rows: RedactedExportRow[], options?: SarCsvOptions): Readable {
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

function buildJsonl(rows: RedactedExportRow[]): Readable {
  const lines = rows.map((row) => `${JSON.stringify(row)}\n`);
  return Readable.from(lines);
}

export class PeopleSarExporter implements SarExportPort {
  private readonly dependencies: Required<PeopleSarExportDependencies>;

  constructor(dependencies: PeopleSarExportDependencies) {
    this.dependencies = {
      ...dependencies,
      auditLogger: dependencies.auditLogger ?? recordAuditEvent,
      now: dependencies.now ?? (() => new Date()),
      redactionFields: dependencies.redactionFields ?? [],
    };
  }

  async exportPeople(
    authorization: RepositoryAuthorizationContext,
    options?: PeopleSarExportOptions,
  ): Promise<PeopleSarExportResponse> {
    const parsedOptions = sarExportOptionsSchema.parse(options ?? {});
    const now = this.dependencies.now();
    const correlationId = parsedOptions.correlationId ?? authorization.correlationId;
    const auditSource = parsedOptions.auditSource ?? authorization.auditSource;

    const profiles = parsedOptions.includeProfiles
      ? await this.dependencies.profileRepo.getEmployeeProfilesByOrganization(authorization.orgId)
      : [];
    const contracts = parsedOptions.includeContracts
      ? await this.dependencies.contractRepo.getEmploymentContractsByOrganization(authorization.orgId)
      : [];

    profiles.forEach((profile) => {
      const classification = profile.dataClassification ?? authorization.dataClassification;
      const residency = profile.dataResidency ?? authorization.dataResidency;
      safeRegisterTag(registerPeopleProfilesTag, {
        orgId: profile.orgId,
        classification,
        residency,
      });
    });
    contracts.forEach((contract) => {
      const classification = contract.dataClassification ?? authorization.dataClassification;
      const residency = contract.dataResidency ?? authorization.dataResidency;
      safeRegisterTag(registerPeopleContractsTag, {
        orgId: contract.orgId,
        classification,
        residency,
      });
    });

    const rows: RedactedExportRow[] = [];
    let skipped = 0;

    for (const profile of profiles) {
      if (shouldOmitForErasure(profile)) {
        skipped += 1;
        await this.dependencies.auditLogger(
          toAuditPayload({
            authorization,
            record: profile,
            action: AUDIT_ACTION_SKIP,
            resource: AUDIT_RESOURCE_PROFILE,
            correlationId,
            reason: SKIP_REASON_ERASURE,
            auditSource,
          }),
        );
        continue;
      }
      if (isRetentionExpired(profile.retentionExpiresAt, now)) {
        skipped += 1;
        await this.dependencies.auditLogger(
          toAuditPayload({
            authorization,
            record: profile,
            action: AUDIT_ACTION_SKIP,
            resource: AUDIT_RESOURCE_PROFILE,
            correlationId,
            reason: SKIP_REASON_RETENTION,
            auditSource,
          }),
        );
        continue;
      }

      const { redacted, redactedFields } = redactProfile(profile, this.dependencies.redactionFields);
      rows.push(redacted);
      await this.dependencies.auditLogger(
        toAuditPayload({
          authorization,
          record: profile,
          action: AUDIT_ACTION_EXPORT,
          resource: AUDIT_RESOURCE_PROFILE,
          redactedFields,
          correlationId,
          auditSource,
        }),
      );
    }

    for (const contract of contracts) {
      if (shouldOmitForErasure(contract)) {
        skipped += 1;
        await this.dependencies.auditLogger(
          toAuditPayload({
            authorization,
            record: contract,
            action: AUDIT_ACTION_SKIP,
            resource: AUDIT_RESOURCE_CONTRACT,
            correlationId,
            reason: SKIP_REASON_ERASURE,
            auditSource,
          }),
        );
        continue;
      }
      if (isRetentionExpired(contract.retentionExpiresAt, now)) {
        skipped += 1;
        await this.dependencies.auditLogger(
          toAuditPayload({
            authorization,
            record: contract,
            action: AUDIT_ACTION_SKIP,
            resource: AUDIT_RESOURCE_CONTRACT,
            correlationId,
            reason: SKIP_REASON_RETENTION,
            auditSource,
          }),
        );
        continue;
      }

      const { redacted, redactedFields } = redactContract(contract, this.dependencies.redactionFields);
      rows.push({
        ...redacted,
        startDate: toIso(contract.startDate) ?? redacted.startDate,
        endDate: toIso(contract.endDate) ?? redacted.endDate,
      });
      await this.dependencies.auditLogger(
        toAuditPayload({
          authorization,
          record: contract,
          action: AUDIT_ACTION_EXPORT,
          resource: AUDIT_RESOURCE_CONTRACT,
          redactedFields,
          correlationId,
          auditSource,
        }),
      );
    }

    const stream = parsedOptions.format === 'csv'
      ? buildCsv(rows, parsedOptions.csvOptions)
      : buildJsonl(rows);

    return {
      stream,
      counts: {
        profiles: rows.filter((row) => row.resource === EXPORT_ROW_PROFILE).length,
        contracts: rows.filter((row) => row.resource === EXPORT_ROW_CONTRACT).length,
        skipped,
      },
      format: parsedOptions.format,
      correlationId,
    };
  }
}
