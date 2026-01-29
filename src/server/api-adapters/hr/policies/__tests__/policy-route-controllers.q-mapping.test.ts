import { describe, it, expect, vi } from "vitest";

vi.mock("@/server/api-adapters/hr/policies", () => ({
  listHrPoliciesController: vi.fn(async () => ({ success: true, policies: [] })),
}));

import { listHrPoliciesRouteController } from "../policy-route-controllers";
import { listHrPoliciesController } from "@/server/api-adapters/hr/policies";

function makeRequest(url: string): Request { return new Request(url, { headers: new Headers() }); }

describe("policy-route-controllers q mapping", () => {
  it("maps q=benefits to BENEFITS category", async () => {
    await listHrPoliciesRouteController(makeRequest("https://example.com/api/hr/policies?q=benefits"));
    const call = (listHrPoliciesController as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.input.filters.category).toBe("BENEFITS");
    expect(call.input.filters.q).toBe("benefits");
  });

  it("respects nocat=1 and does not auto-map category", async () => {
    (listHrPoliciesController as any).mockClear();
    await listHrPoliciesRouteController(makeRequest("https://example.com/api/hr/policies?q=benefits&nocat=1"));
    const call = (listHrPoliciesController as any).mock.calls[0][0];
    expect(call.input.filters.category).toBeUndefined();
    expect(call.input.filters.q).toBe("benefits");
  });

  it("maps q=security to IT_SECURITY category", async () => {
    (listHrPoliciesController as any).mockClear();
    await listHrPoliciesRouteController(makeRequest("https://example.com/api/hr/policies?q=security"));
    const call = (listHrPoliciesController as any).mock.calls[0][0];
    expect(call.input.filters.category).toBe("IT_SECURITY");
  });
});
