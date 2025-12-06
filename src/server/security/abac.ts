import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import { PrismaAbacPolicyRepository } from '@/server/repositories/prisma/org/abac/prisma-abac-policy-repository';
import type { AbacPolicy, AbacCondition } from './abac-types';

let abacPolicyRepository: IAbacPolicyRepository | null = null;

function getAbacPolicyRepository(): IAbacPolicyRepository {
  const repo = abacPolicyRepository ?? new PrismaAbacPolicyRepository();
  abacPolicyRepository ??= repo;
  return repo;
}

export function setAbacPolicyRepository(repository: IAbacPolicyRepository): void {
  abacPolicyRepository = repository;
}

// Simple ABAC evaluator that reads policies from Organization.settings.abacPolicies
export async function getTenantAbacPolicies(orgId: string): Promise<AbacPolicy[]> {
  const policies = await getAbacPolicyRepository().getPoliciesForOrg(orgId);
  return policies.slice().sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

function matchesExpected(expected: unknown, actual: unknown): boolean {
  if (expected === undefined) { return true; }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) { return false; }
    return expected.every((element) => (actual as unknown[]).includes(element));
  }
  return actual === expected;
}

function checkSubjectCondition(subjectCondition: Record<string, unknown>, subject: Record<string, unknown>): boolean {
  for (const [key, expected] of Object.entries(subjectCondition)) {
    if (expected === undefined) { continue; }
    if (!matchesExpected(expected, subject[key])) { return false; }
  }
  return true;
}

function checkResourceCondition(resourceCondition: Record<string, unknown>, subject: Record<string, unknown>, resource: Record<string, unknown>): boolean {
  for (const [key, expected] of Object.entries(resourceCondition)) {
    if (expected === undefined) { continue; }
    if (typeof expected === 'string' && expected.startsWith('$subject.')) {
      const subjectKey = expected.replace('$subject.', '');
      const subjectValue = subject[subjectKey];
      if (!matchesExpected(subjectValue, resource[key])) { return false; }
    } else if (!matchesExpected(expected, resource[key])) {
      return false;
    }
  }
  return true;
}

function evaluateCondition(condition: AbacCondition | undefined, subject: Record<string, unknown>, resource: Record<string, unknown>): boolean {
  if (!condition) { return true; }
  // Simple structure: exact match for keys. Support subject placeholders via templating using '$subject.' or '$resource.'
  if (condition.subject && !checkSubjectCondition(condition.subject, subject)) { return false; }
  if (condition.resource && !checkResourceCondition(condition.resource, subject, resource)) { return false; }
  return true;
}

export async function evaluateAbac(
  orgId: string,
  action: string,
  resourceType: string,
  subjectAttributes: Record<string, unknown>,
  resourceAttributes: Record<string, unknown>,
): Promise<boolean> {
  const policies = await getTenantAbacPolicies(orgId);
  let allowed = false;
  for (const policy of policies) {
    if (!policy.actions.includes(action)) { continue; }
    if (!policy.resources.includes(resourceType)) { continue; }
    const matches = evaluateCondition(policy.condition, subjectAttributes, resourceAttributes);
    if (!matches) { continue; }
    if (policy.effect === 'deny') { return false; }
    else { allowed = true; }
  }
  return allowed;
}

// A convenience wrapper for generating a subject object (roles & attributes) for evaluation
export function makeSubject(orgId: string, userId: string, roles?: string[], attributes?: Record<string, unknown>): Record<string, unknown> {
  return { orgId, userId, roles: roles ?? [], ...attributes };
}

export function makeResource(attributes?: Record<string, unknown>): Record<string, unknown> {
  return attributes ?? {};
}
