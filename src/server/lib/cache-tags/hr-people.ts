import type { DataClassificationLevel, DataResidencyZone } from '@/server/types/tenant';
import { buildCacheTag, invalidateCache, registerCacheTag } from '@/server/lib/cache-tags';
import {
  CACHE_SCOPE_PEOPLE_CONTRACTS,
  CACHE_SCOPE_PEOPLE_PROFILES,
  type CacheScope,
} from '@/server/constants/cache-scopes';

export const HR_PEOPLE_CACHE_SCOPES = {
  profiles: CACHE_SCOPE_PEOPLE_PROFILES,
  contracts: CACHE_SCOPE_PEOPLE_CONTRACTS,
} as const;

export type HrPeopleCacheScopeKey = keyof typeof HR_PEOPLE_CACHE_SCOPES;

export interface PeopleCacheContext {
  orgId: string;
  classification: DataClassificationLevel;
  residency: DataResidencyZone;
}

export function resolvePeopleCacheScopes(options?: {
  includeProfiles?: boolean;
  includeContracts?: boolean;
}): CacheScope[] {
  const scopes = new Set<CacheScope>();

  if (options?.includeProfiles ?? true) {
    scopes.add(HR_PEOPLE_CACHE_SCOPES.profiles);
  }

  if (options?.includeContracts ?? true) {
    scopes.add(HR_PEOPLE_CACHE_SCOPES.contracts);
  }

  return Array.from(scopes);
}

export function buildPeopleProfilesTag(context: PeopleCacheContext): string {
  return buildCacheTag({
    orgId: context.orgId,
    scope: HR_PEOPLE_CACHE_SCOPES.profiles,
    classification: context.classification,
    residency: context.residency,
  });
}

export function buildPeopleContractsTag(context: PeopleCacheContext): string {
  return buildCacheTag({
    orgId: context.orgId,
    scope: HR_PEOPLE_CACHE_SCOPES.contracts,
    classification: context.classification,
    residency: context.residency,
  });
}

export function registerPeopleProfilesTag(context: PeopleCacheContext): void {
  registerCacheTag({
    orgId: context.orgId,
    scope: HR_PEOPLE_CACHE_SCOPES.profiles,
    classification: context.classification,
    residency: context.residency,
  });
}

export function registerPeopleContractsTag(context: PeopleCacheContext): void {
  registerCacheTag({
    orgId: context.orgId,
    scope: HR_PEOPLE_CACHE_SCOPES.contracts,
    classification: context.classification,
    residency: context.residency,
  });
}

export async function invalidatePeopleProfiles(context: PeopleCacheContext): Promise<void> {
  await invalidateCache({
    orgId: context.orgId,
    scope: HR_PEOPLE_CACHE_SCOPES.profiles,
    classification: context.classification,
    residency: context.residency,
  });
}

export async function invalidatePeopleContracts(context: PeopleCacheContext): Promise<void> {
  await invalidateCache({
    orgId: context.orgId,
    scope: HR_PEOPLE_CACHE_SCOPES.contracts,
    classification: context.classification,
    residency: context.residency,
  });
}
