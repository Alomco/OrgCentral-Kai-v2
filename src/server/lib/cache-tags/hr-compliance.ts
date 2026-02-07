import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { buildCacheTag, invalidateCache, registerCacheTag } from '@/server/lib/cache-tags';
import {
  CACHE_SCOPE_COMPLIANCE_ITEMS,
  CACHE_SCOPE_COMPLIANCE_STATUS,
  type CacheScope,
} from '@/server/constants/cache-scopes';

export const HR_COMPLIANCE_CACHE_SCOPES = {
  status: CACHE_SCOPE_COMPLIANCE_STATUS,
  items: CACHE_SCOPE_COMPLIANCE_ITEMS,
} as const;

export type HrComplianceCacheScopeKey = keyof typeof HR_COMPLIANCE_CACHE_SCOPES;

export interface ComplianceCacheContext {
  orgId: string;
  classification: DataClassificationLevel;
  residency: DataResidencyZone;
}

export function resolveComplianceCacheScopes(options?: {
  includeStatus?: boolean;
  includeItems?: boolean;
}): CacheScope[] {
  const scopes = new Set<CacheScope>();

  if (options?.includeStatus ?? true) {
    scopes.add(HR_COMPLIANCE_CACHE_SCOPES.status);
  }

  if (options?.includeItems ?? true) {
    scopes.add(HR_COMPLIANCE_CACHE_SCOPES.items);
  }

  return Array.from(scopes);
}

export function buildComplianceStatusTag(context: ComplianceCacheContext): string {
  return buildCacheTag({
    orgId: context.orgId,
    scope: HR_COMPLIANCE_CACHE_SCOPES.status,
    classification: context.classification,
    residency: context.residency,
  });
}

export function buildComplianceItemsTag(context: ComplianceCacheContext): string {
  return buildCacheTag({
    orgId: context.orgId,
    scope: HR_COMPLIANCE_CACHE_SCOPES.items,
    classification: context.classification,
    residency: context.residency,
  });
}

export function registerComplianceStatusTag(context: ComplianceCacheContext): void {
  registerCacheTag({
    orgId: context.orgId,
    scope: HR_COMPLIANCE_CACHE_SCOPES.status,
    classification: context.classification,
    residency: context.residency,
  });
}

export function registerComplianceItemsTag(context: ComplianceCacheContext): void {
  registerCacheTag({
    orgId: context.orgId,
    scope: HR_COMPLIANCE_CACHE_SCOPES.items,
    classification: context.classification,
    residency: context.residency,
  });
}

export async function invalidateComplianceStatus(
  context: ComplianceCacheContext,
): Promise<void> {
  await invalidateCache({
    orgId: context.orgId,
    scope: HR_COMPLIANCE_CACHE_SCOPES.status,
    classification: context.classification,
    residency: context.residency,
  });
}

export async function invalidateComplianceItems(
  context: ComplianceCacheContext,
): Promise<void> {
  await invalidateCache({
    orgId: context.orgId,
    scope: HR_COMPLIANCE_CACHE_SCOPES.items,
    classification: context.classification,
    residency: context.residency,
  });
}
