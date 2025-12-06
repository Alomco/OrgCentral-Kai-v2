import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PeopleServiceDependencies } from './people-service.types';

const peopleServiceFactory = vi.fn((deps: unknown) => ({ deps }));

vi.mock('@/server/repositories/prisma/hr/people', () => ({
  PrismaEmployeeProfileRepository: vi.fn(() => ({ profileRepo: true })),
  PrismaEmploymentContractRepository: vi.fn(() => ({ contractRepo: true })),
}));

vi.mock('./people-service', () => ({
  PeopleService: peopleServiceFactory,
}));

import { getPeopleService } from './people-service.provider';

describe('people-service.provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a shared PeopleService instance when called without overrides', () => {
    const first = getPeopleService();
    const second = getPeopleService();

    expect(first).toBe(second);
    expect(peopleServiceFactory).toHaveBeenCalledTimes(1);
  });

  it('creates a new PeopleService when overrides are provided', () => {
    const overrideDeps: Partial<PeopleServiceDependencies> = {
      profileRepo: { custom: true } as unknown as PeopleServiceDependencies['profileRepo'],
      contractRepo: { custom: true } as unknown as PeopleServiceDependencies['contractRepo'],
    };
    const custom = getPeopleService(overrideDeps);

    expect(custom).not.toBe(getPeopleService());
    expect(peopleServiceFactory).toHaveBeenCalledTimes(2);
    expect(peopleServiceFactory).toHaveBeenLastCalledWith(expect.objectContaining(overrideDeps));
  });
});
