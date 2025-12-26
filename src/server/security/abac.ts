import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import { appLogger } from '@/server/logging/structured-logger';
import type { AbacPolicy } from './abac-types';
import { normalizeAbacPolicies } from './abac-policy-normalizer';
import { DEFAULT_BOOTSTRAP_POLICIES } from './abac-constants';
import { evaluateCondition, matchesPolicySelector, subjectHasRole } from './abac-helpers';
export { makeResource, makeSubject } from './abac-helpers';

export interface AbacServiceOptions {
  logger?: (event: string, metadata?: Record<string, unknown>) => void;
}

export class AbacService {
  private repositoryInitPromise: Promise<IAbacPolicyRepository> | null = null;

  constructor(
    private repository: IAbacPolicyRepository | null = null,
    private readonly options: AbacServiceOptions = {},
  ) {}

  private async getRepository(): Promise<IAbacPolicyRepository> {
    if (this.repository) {
      return this.repository;
    }

    if (this.repositoryInitPromise) {
      return this.repositoryInitPromise;
    }

    // Lazy-load Prisma-backed repository to keep tests free from DB client requirements.
    // Using dynamic import avoids forbidden require() and keeps the dependency optional until needed.
    this.repositoryInitPromise = (async () => {
      const prismaRepositoryModule = await import('@/server/repositories/prisma/org/abac/prisma-abac-policy-repository');
      const repository = new prismaRepositoryModule.PrismaAbacPolicyRepository();
      this.repository = repository;
      this.repositoryInitPromise = null;
      return repository;
    })();

    return this.repositoryInitPromise;
  }

  setRepository(repository: IAbacPolicyRepository): void {
    this.repository = repository;
    this.repositoryInitPromise = null;
  }

  private isBasicPolicy(policy: unknown): policy is AbacPolicy {
    if (!policy || typeof policy !== 'object') { return false; }
    const record = policy as Record<string, unknown>;
    const hasId = typeof record.id === 'string' && record.id.length > 0;
    const hasEffect = record.effect === 'allow' || record.effect === 'deny';
    const actions = Array.isArray(record.actions) ? record.actions : [];
    const resources = Array.isArray(record.resources) ? record.resources : [];
    return hasId && hasEffect && actions.length > 0 && resources.length > 0;
  }

  async getPolicies(orgId: string): Promise<AbacPolicy[]> {
    const repository = await this.getRepository();
    const raw = await repository.getPoliciesForOrg(orgId);
    if (!raw.length) {
      return [...DEFAULT_BOOTSTRAP_POLICIES].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }

    const normalized = normalizeAbacPolicies(raw);
    if (normalized.length > 0) {
      const normalizedIds = new Set(normalized.map((p) => p.id));
      const rescued = raw.filter(
        (policy): policy is AbacPolicy => this.isBasicPolicy(policy) && !normalizedIds.has(policy.id),
      );
      if (rescued.length && this.options.logger) {
        this.options.logger('abac.policy.rescued', { orgId, rescuedCount: rescued.length });
      }
      const merged = [...normalized, ...rescued];
      return merged.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }

    // If normalization drops everything, fall back to raw list sorted by priority to avoid losing valid policies.
    const fallback = raw.filter(this.isBasicPolicy.bind(this));
    return fallback.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /**
   * Exposes the normalized, prioritized policy list used for evaluation (primarily for diagnostics/tests).
   */
  async getEvaluatedPoliciesForOrg(orgId: string): Promise<AbacPolicy[]> {
    return this.getPolicies(orgId);
  }

  async evaluate(
    orgId: string,
    action: string,
    resourceType: string,
    subjectAttributes: Record<string, unknown>,
    resourceAttributes: Record<string, unknown>,
  ): Promise<boolean> {
    if (subjectHasRole(subjectAttributes, 'owner')) {
      return true;
    }

    const policies = await this.getPolicies(orgId);
    for (const policy of policies) {
      if (!matchesPolicySelector(action, policy.actions)) { continue; }
      if (!matchesPolicySelector(resourceType, policy.resources)) { continue; }
      const matches = evaluateCondition(policy.condition, subjectAttributes, resourceAttributes);
      if (!matches) { continue; }

      // Priority is enforced by ordering: the first matching policy decides the outcome.
      return policy.effect === 'allow';
    }
    return false;
  }
}

let defaultAbacService: AbacService | null = null;

function getDefaultAbacService(): AbacService {
  defaultAbacService ??= new AbacService(null, {
    logger: (event, metadata) => appLogger.warn(event, metadata),
  });
  return defaultAbacService;
}

export function setAbacPolicyRepository(repository: IAbacPolicyRepository): void {
  getDefaultAbacService().setRepository(repository);
}

// Simple ABAC evaluator that reads policies from Organization.settings.abacPolicies
export function getTenantAbacPolicies(orgId: string): Promise<AbacPolicy[]> {
  return getDefaultAbacService().getPolicies(orgId);
}

export function evaluateAbac(
  orgId: string,
  action: string,
  resourceType: string,
  subjectAttributes: Record<string, unknown>,
  resourceAttributes: Record<string, unknown>,
): Promise<boolean> {
  // NOTE: Policy priority controls evaluation order. The first matching policy (highest priority first)
  // decides the outcome (no deny-overrides after a match). Ensure this aligns with business expectations.
  return getDefaultAbacService().evaluate(orgId, action, resourceType, subjectAttributes, resourceAttributes);
}

// A convenience wrapper for generating a subject object (roles & attributes) for evaluation
