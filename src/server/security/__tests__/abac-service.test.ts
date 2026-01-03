import { describe, it, expect, beforeEach } from 'vitest';

import { AbacService } from '@/server/security/abac';
import type { IAbacPolicyRepository } from '@/server/repositories/contracts/org/abac/abac-policy-repository-contract';
import type { AbacPolicy } from '@/server/security/abac-types';

class FakeAbacPolicyRepository implements IAbacPolicyRepository {
  private readonly policiesByOrg = new Map<string, AbacPolicy[]>();

  constructor(initial?: Record<string, AbacPolicy[]>) {
    if (initial) {
      for (const [orgId, policies] of Object.entries(initial)) {
        this.policiesByOrg.set(orgId, policies);
      }
    }
  }

  async getPoliciesForOrg(orgId: string): Promise<AbacPolicy[]> {
    return this.policiesByOrg.get(orgId) ?? [];
  }

  async setPoliciesForOrg(orgId: string, policies: AbacPolicy[]): Promise<void> {
    this.policiesByOrg.set(orgId, policies);
  }
}

describe('AbacService', () => {
  const orgId = 'org-1';
  let repository: FakeAbacPolicyRepository;
  let service: AbacService;

  beforeEach(() => {
    repository = new FakeAbacPolicyRepository();
    service = new AbacService(repository);
  });

  it('normalizes policies by dropping invalid entries, deduping IDs, and sorting by priority', async () => {
    const validLowPriority: AbacPolicy = {
      id: 'policy-1',
      effect: 'allow',
      actions: ['read'],
      resources: ['hr.time-entry'],
      priority: 1,
    };
    const duplicateIdHigherPriority: AbacPolicy = {
      ...validLowPriority,
      priority: 5,
    };
    const highestPriority: AbacPolicy = {
      id: 'policy-2',
      effect: 'allow',
      actions: ['*'],
      resources: ['*'],
      priority: 10,
    };

    await repository.setPoliciesForOrg(orgId, [
      validLowPriority,
      // Invalid (actions empty) should be removed by normalizer
      { id: 'invalid', effect: 'allow', actions: [], resources: ['*'] } as unknown as AbacPolicy,
      duplicateIdHigherPriority,
      highestPriority,
    ]);

    const policies = await service.getPolicies(orgId);
    expect(policies.map((p) => p.id)).toEqual(['policy-2', 'policy-1']);
    expect(policies[0].priority).toBe(10);
    expect(policies[1].priority).toBe(5);
  });

  it('allows when a matching allow policy is found', async () => {
    await repository.setPoliciesForOrg(orgId, [
      {
        id: 'allow-read',
        effect: 'allow',
        actions: ['read'],
        resources: ['hr.time-entry'],
      },
    ]);

    const allowed = await service.evaluate(
      orgId,
      'read',
      'hr.time-entry',
      { roles: ['member'], userId: 'user-1' },
      { entryId: 'entry-123' },
    );

    expect(allowed).toBe(true);
  });

  it('denies when a matching deny policy is hit even if an allow policy also matches', async () => {
    await repository.setPoliciesForOrg(orgId, [
      {
        id: 'allow-all',
        effect: 'allow',
        actions: ['*'],
        resources: ['hr.time-entry'],
      },
      {
        id: 'deny-blocked-status',
        effect: 'deny',
        actions: ['update'],
        resources: ['hr.time-entry'],
        condition: {
          resource: {
            status: { op: 'eq', value: 'BLOCKED' },
          },
        },
        priority: 50,
      },
    ]);

    const normalized = await service.getEvaluatedPoliciesForOrg(orgId);
    expect(normalized.map((p) => p.id)).toEqual(['deny-blocked-status', 'allow-all']);

    const denied = await service.evaluate(
      orgId,
      'update',
      'hr.time-entry',
      { roles: ['member'], userId: 'user-1' },
      { status: 'BLOCKED' },
    );
    const allowed = await service.evaluate(
      orgId,
      'update',
      'hr.time-entry',
      { roles: ['member'], userId: 'user-1' },
      { status: 'OPEN' },
    );

    expect(denied).toBe(false);
    expect(allowed).toBe(true);
  });

  it('supports predicate evaluation with dynamic subject references', async () => {
    await repository.setPoliciesForOrg(orgId, [
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

    const normalized = await service.getEvaluatedPoliciesForOrg(orgId);
    expect(normalized.map((p) => p.id)).toEqual(['owner-only']);

    const canReadOwn = await service.evaluate(
      orgId,
      'read',
      'hr.time-entry',
      { roles: ['member'], userId: 'user-1' },
      { ownerId: 'user-1' },
    );
    const cannotReadOthers = await service.evaluate(
      orgId,
      'read',
      'hr.time-entry',
      { roles: ['member'], userId: 'user-1' },
      { ownerId: 'user-2' },
    );

    expect(canReadOwn).toBe(true);
    expect(cannotReadOthers).toBe(false);
  });

});
