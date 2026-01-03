import { describe, it, expect } from 'vitest';

import {
    evaluateAbac,
    makeResource,
    makeSubject,
    AbacService,
} from '@/server/security/abac';
import type { AbacPolicy } from '@/server/security/abac-types';
import { normalizeAbacPolicies } from '@/server/security/abac-policy-normalizer';

class FakeRepository {
  private readonly policiesByOrg = new Map<string, AbacPolicy[]>();

  constructor(seed?: AbacPolicy[]) {
    if (seed) {
      this.policiesByOrg.set('org-1', seed);
    }
  }

  async getPoliciesForOrg(orgId: string): Promise<AbacPolicy[]> {
    return this.policiesByOrg.get(orgId) ?? [];
  }

  async setPoliciesForOrg(orgId: string, policies: AbacPolicy[]): Promise<void> {
    this.policiesByOrg.set(orgId, policies);
  }
}

describe('evaluateCondition and selector logic', () => {
  it('prefers deny when multiple policies match with higher priority deny', async () => {
    const repo = new FakeRepository([
      {
        id: 'allow-all',
        effect: 'allow',
        actions: ['*'],
        resources: ['hr.time-entry'],
        priority: 1,
      },
      {
        id: 'deny-updates-when-blocked',
        effect: 'deny',
        actions: ['update'],
        resources: ['hr.time-entry'],
        condition: {
          resource: {
            status: { op: 'eq', value: 'BLOCKED' },
          },
        },
        priority: 10,
      },
    ]);
    const service = new AbacService(repo);
    const policies = await service.getEvaluatedPoliciesForOrg('org-1');
    expect(policies.map((p) => p.id)).toEqual(['deny-updates-when-blocked', 'allow-all']);

    const denyResult = await service.evaluate(
      'org-1',
      'update',
      'hr.time-entry',
      makeSubject('org-1', 'user-1', ['member']),
      makeResource({ status: 'BLOCKED' }),
    );
    const allowResult = await service.evaluate(
      'org-1',
      'update',
      'hr.time-entry',
      makeSubject('org-1', 'user-1', ['member']),
      makeResource({ status: 'OPEN' }),
    );

    expect(denyResult).toBe(false);
    expect(allowResult).toBe(true);
  });

  it('supports $subject references in predicate values', async () => {
    const repo = new FakeRepository([
      {
        id: 'owner-only',
        effect: 'allow',
        actions: ['read'],
        resources: ['hr.time-entry'],
        condition: {
          resource: {
            ownerId: { op: 'eq', value: '$subject.userId' },
          },
        },
      },
    ]);
    const service = new AbacService(repo);

    const canReadOwn = await service.evaluate(
      'org-1',
      'read',
      'hr.time-entry',
      makeSubject('org-1', 'user-1', ['member']),
      makeResource({ ownerId: 'user-1' }),
    );
    const cannotReadOthers = await service.evaluate(
      'org-1',
      'read',
      'hr.time-entry',
      makeSubject('org-1', 'user-1', ['member']),
      makeResource({ ownerId: 'user-2' }),
    );

    expect(canReadOwn).toBe(true);
    expect(cannotReadOthers).toBe(false);
  });

  it('honors highest priority when allow outranks deny', async () => {
    const repo = new FakeRepository([
      {
        id: 'allow-high-priority',
        effect: 'allow',
        actions: ['read'],
        resources: ['hr.time-entry'],
        priority: 100,
      },
      {
        id: 'deny-low-priority',
        effect: 'deny',
        actions: ['read'],
        resources: ['hr.time-entry'],
        priority: 1,
      },
    ]);
    const service = new AbacService(repo);

    const allowed = await service.evaluate(
      'org-1',
      'read',
      'hr.time-entry',
      makeSubject('org-1', 'user-1', ['member']),
      makeResource({}),
    );

    expect(allowed).toBe(true);
  });

});
