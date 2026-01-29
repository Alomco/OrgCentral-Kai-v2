import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/api-adapters/org/audit/audit-route-controllers', () => ({
  listAuditLogsController: vi.fn(async () => ({ logs: [
    { id: 'a1', orgId: 'org1', userId: 'u1', eventType: 'ACCESS', action: 'org.view', resource: 'org.auditLog', createdAt: new Date().toISOString() }
  ] }))
}));

import { GET } from '../route';

describe('audit logs route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns logs array', async () => {
    const req = new Request('http://localhost/api/org/org1/audit/logs');
    const res = await GET(req as any, { params: { orgId: 'org1' } } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.logs)).toBe(true);
  });
});

