import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import { appLogger } from '@/server/logging/structured-logger';
import type {
  AbacPolicy,
  AbacCondition,
  AbacAttribute,
  AbacPredicate,
  AbacOperator,
} from './abac-types';
import { normalizeAbacPolicies } from './abac-policy-normalizer';

function isPredicate(value: unknown): value is AbacPredicate {
  return Boolean(value) && typeof value === 'object' && 'op' in (value as AbacPredicate) && 'value' in (value as AbacPredicate);
}

function resolveDynamicReference(value: AbacAttribute | AbacAttribute[] | undefined, subject: Record<string, unknown>, resource: Record<string, unknown>): AbacAttribute | AbacAttribute[] | undefined {
  if (Array.isArray(value)) {
    return value.map((entry) => resolveDynamicReference(entry as AbacAttribute, subject, resource) as AbacAttribute);
  }

  if (typeof value === 'string') {
    if (value.startsWith('$subject.')) {
      const subjectKey = value.replace('$subject.', '');
      return subject[subjectKey] as AbacAttribute;
    }
    if (value.startsWith('$resource.')) {
      const resourceKey = value.replace('$resource.', '');
      return resource[resourceKey] as AbacAttribute;
    }
  }
  return value;
}

function applyOperator(operator: AbacOperator, expected: AbacAttribute | AbacAttribute[] | undefined, actual: unknown): boolean {
  if (expected === undefined) { return true; }
  const expectedArray = Array.isArray(expected) ? expected : [expected];

  switch (operator) {
    case 'eq': {
      if (Array.isArray(actual)) {
        return expectedArray.every((value) => (actual as unknown[]).includes(value as never));
      }
      return expectedArray.every((value) => value === actual);
    }
    case 'ne': {
      return expectedArray.every((value) => value !== actual);
    }
    case 'in': {
      return expectedArray.some((value) => value === actual);
    }
    case 'gt': {
      if (typeof actual !== 'number' && typeof actual !== 'string') { return false; }
      return expectedArray.every((value) => {
        if (Array.isArray(value)) { return false; }
        if (typeof value !== 'number' && typeof value !== 'string') { return false; }
        return actual > value;
      });
    }
    case 'lt': {
      if (typeof actual !== 'number' && typeof actual !== 'string') { return false; }
      return expectedArray.every((value) => {
        if (Array.isArray(value)) { return false; }
        if (typeof value !== 'number' && typeof value !== 'string') { return false; }
        return actual < value;
      });
    }
    default:
      return false;
  }
}

function matchesRule(
  rule: AbacAttribute | AbacPredicate | undefined,
  actual: unknown,
  subject: Record<string, unknown>,
  resource: Record<string, unknown>,
): boolean {
  if (rule === undefined) {
    return true;
  }

  if (isPredicate(rule)) {
    const resolvedValue = resolveDynamicReference(rule.value, subject, resource);
    return applyOperator(rule.op, resolvedValue, actual);
  }

  const resolved = resolveDynamicReference(rule, subject, resource);
  return applyOperator('eq', resolved, actual);
}

function evaluateCondition(condition: AbacCondition | undefined, subject: Record<string, unknown>, resource: Record<string, unknown>): boolean {
  if (!condition) { return true; }

  if (condition.subject) {
    for (const [key, expected] of Object.entries(condition.subject)) {
      if (!matchesRule(expected, subject[key], subject, resource)) { return false; }
    }
  }

  if (condition.resource) {
    for (const [key, expected] of Object.entries(condition.resource)) {
      if (!matchesRule(expected, resource[key], subject, resource)) { return false; }
    }
  }

  return true;
}

function matchesPolicySelector(value: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern === '*') { return true; }
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (prefix.length > 0 && value.startsWith(prefix)) { return true; }
      continue;
    }
    if (pattern === value) { return true; }
  }
  return false;
}

function subjectHasRole(subjectAttributes: Record<string, unknown>, role: string): boolean {
  const roles = subjectAttributes.roles;
  return Array.isArray(roles) && roles.some((entry) => entry === role);
}

export interface AbacServiceOptions {
  logger?: (event: string, metadata?: Record<string, unknown>) => void;
}

export class AbacService {
  private repositoryInitPromise: Promise<IAbacPolicyRepository> | null = null;

  constructor(
    private repository: IAbacPolicyRepository | null = null,
    private readonly options: AbacServiceOptions = {},
  ) { }

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
      return [];
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
export function makeSubject(orgId: string, userId: string, roles?: string[], attributes?: Record<string, unknown>): Record<string, unknown> {
  return { orgId, userId, roles: roles ?? [], ...attributes };
}

export function makeResource(attributes?: Record<string, unknown>): Record<string, unknown> {
  return attributes ?? {};
}
