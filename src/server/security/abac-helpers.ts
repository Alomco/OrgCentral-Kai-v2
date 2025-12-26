import type { AbacAttribute, AbacCondition, AbacOperator, AbacPredicate } from './abac-types';

function isPredicate(value: unknown): value is AbacPredicate {
  return Boolean(value) && typeof value === 'object' && 'op' in (value as AbacPredicate) && 'value' in (value as AbacPredicate);
}

function resolveDynamicReference(
  value: AbacAttribute | AbacAttribute[] | undefined,
  subject: Record<string, unknown>,
  resource: Record<string, unknown>,
): AbacAttribute | AbacAttribute[] | undefined {
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

function applyOperator(
  operator: AbacOperator,
  expected: AbacAttribute | AbacAttribute[] | undefined,
  actual: unknown,
): boolean {
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

export function evaluateCondition(
  condition: AbacCondition | undefined,
  subject: Record<string, unknown>,
  resource: Record<string, unknown>,
): boolean {
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

export function matchesPolicySelector(value: string, patterns: string[]): boolean {
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

export function subjectHasRole(subjectAttributes: Record<string, unknown>, role: string): boolean {
  const roles = subjectAttributes.roles;
  return Array.isArray(roles) && roles.some((entry) => entry === role);
}

export function makeSubject(
  orgId: string,
  userId: string,
  roles?: string[],
  attributes?: Record<string, unknown>,
): Record<string, unknown> {
  return { orgId, userId, roles: roles ?? [], ...attributes };
}

export function makeResource(attributes?: Record<string, unknown>): Record<string, unknown> {
  return attributes ?? {};
}
