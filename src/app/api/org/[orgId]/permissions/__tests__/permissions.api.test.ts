import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/api-adapters/org/permissions/permission-route-controllers", () => ({
  listPermissionResourcesController: vi.fn(async () => ({ resources: [{ id: "r1", resource: "org.test", actions: ["read"], description: null, createdAt: new Date(), updatedAt: new Date() }] })),
  createPermissionResourceController: vi.fn(async () => ({ resource: { id: "r2", resource: "org.new", actions: ["read"], description: null, createdAt: new Date(), updatedAt: new Date() } })),
}));

import { GET, POST } from "../route";

describe("permissions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 200 with resources", async () => {
    const req = new Request("http://localhost/api/org/org1/permissions");
    const res = await GET(req as any, { params: { orgId: "org1" } } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.resources)).toBe(true);
  });

  it("POST returns 201 on create", async () => {
    const req = new Request("http://localhost/api/org/org1/permissions", { method: "POST", body: JSON.stringify({ resource: "org.new", actions: ["read"] }), headers: { "content-type": "application/json" } });
    const res = await POST(req as any, { params: { orgId: "org1" } } as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.resource?.resource).toBe("org.new");
  });
});
