import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

vi.mock('@/server/use-cases/auth/sessions/get-session', () => ({
  getSessionContext: vi.fn(() => Promise.resolve({
    authorization: {
      orgId: 'org-1',
      userId: 'actor-1',
      roleKey: 'member',
      dataResidency: 'UK_ONLY',
      dataClassification: 'OFFICIAL',
    },
  })),
}));

const createEmployeeProfile = vi.fn((_input: { authorization: unknown; payload: unknown }) => ({ profileId: 'profile-123' }));

vi.mock('@/server/services/hr/people/people-service.provider', () => ({
  getPeopleService: vi.fn(() => ({
    createEmployeeProfile,
  })),
}));

import { createEmployeeProfileAdapter } from '../create-employee-profile';

interface ResponseMock extends Partial<NextApiResponse> {
  body?: unknown;
  statusCode?: number;
}

function buildResponseStub(): ResponseMock {
  const res: ResponseMock = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res as NextApiResponse;
  };
  res.json = (payload: Record<string, unknown>) => {
    res.body = payload;
    return res as NextApiResponse;
  };
  return res;
}

describe('people API adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an employee profile via PeopleService', async () => {
    const req = {
      body: {
        orgId: 'org-1',
        actorUserId: 'actor-1',
        targetUserId: 'user-1',
        dataResidency: 'UK_ONLY',
        dataClassification: 'OFFICIAL',
        changes: {
          employeeNumber: 'E-1',
          employmentType: 'FULL_TIME',
          healthStatus: 'UNDEFINED',
        },
      },
      headers: {},
    } satisfies Partial<NextApiRequest>;
    const res = buildResponseStub();

    await createEmployeeProfileAdapter(req as NextApiRequest, res as NextApiResponse);

    const call = createEmployeeProfile.mock.calls[0][0] as Record<string, unknown>;
    expect(call).toMatchObject({
      authorization: { orgId: 'org-1', userId: 'actor-1' },
      payload: {
        profileData: {
          userId: 'user-1',
          employmentType: 'FULL_TIME',
          healthStatus: 'UNDEFINED',
        },
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { profileId: 'profile-123' } });
  });
});
