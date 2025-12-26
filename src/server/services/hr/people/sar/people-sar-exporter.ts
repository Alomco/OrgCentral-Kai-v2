import { sarExportOptionsSchema } from './people-sar-exporter.schemas';
import {
  type PeopleSarExportDependencies,
  type PeopleSarExportOptions,
  type PeopleSarExportResponse,
  type RedactedExportRow,
  type SarExportPort,
} from './people-sar-exporter.types';
import { isRetentionExpired, redactContract, redactProfile, shouldOmitForErasure } from './people-sar-exporter.redaction';
import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { recordAuditEvent } from '@/server/logging/audit-logger';
import {
  AUDIT_ACTION_EXPORT,
  AUDIT_ACTION_SKIP,
  AUDIT_RESOURCE_CONTRACT,
  AUDIT_RESOURCE_PROFILE,
  EXPORT_ROW_CONTRACT,
  EXPORT_ROW_PROFILE,
  SKIP_REASON_ERASURE,
  SKIP_REASON_RETENTION,
  buildCsv,
  buildJsonl,
  registerContractCacheTags,
  registerProfileCacheTags,
  toAuditPayload,
  toIso,
} from './people-sar-exporter.helpers';

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

    registerProfileCacheTags(authorization, profiles);
    registerContractCacheTags(authorization, contracts);

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
