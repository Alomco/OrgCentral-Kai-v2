import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/use-cases/auth/sessions/get-session", () => ({
  getSessionContext: vi.fn(async () => ({ authorization: { orgId: "org1", userId: "u1", dataResidency: "EU", dataClassification: "OFFICIAL", auditSource: "test", correlationId: "c1" } }))
}));

vi.mock("@/server/services/org/users/user-service.provider", () => ({
  getUserService: () => ({
    listUsersInOrganizationPaged: async () => ({
      users: [
        { id: "u1", email: "a@example.com", displayName: "A", roles: ["member"], memberships: [{ organizationId: "org1", roles: ["member"], status: "ACTIVE" }] },
        { id: "u2", email: "b@example.com", displayName: "B", roles: ["member"], memberships: [{ organizationId: "org1", roles: ["member"], status: "INVITED" }] }
      ],
      totalCount: 2,
      page: 1,
      pageSize: 1000,
    })
  })
}));

import { GET as ExportGET } from "../export/route";

describe("members export route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV with header and rows", async () => {
    const req = new Request("http://localhost/api/org/org1/members/export?q=a&sort=name&dir=asc");
    const res = await ExportGET(req as any, { params: { orgId: "org1" } } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type") || "").toContain("text/csv");
    const text = await res.text();
    expect(text.split('\n')[0]).toBe("id,email,displayName,roles,status");
  });
});
