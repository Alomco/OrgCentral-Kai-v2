// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { RolesListClient } from "../_components/roles-list.client";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/roles`;

describe("RolesListClient invalidation", () => {
  beforeEach(() => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ roles: [{ id: "r1", orgId, name: "member", description: null, scope: "ORG", permissions: {}, createdAt: new Date(), updatedAt: new Date() }] })),
    );
  });

  it("shows new role after invalidation", async () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <RolesListClient orgId={orgId} initial={[{ id: "r1", orgId, name: "member", description: null, scope: "ORG", permissions: {}, createdAt: new Date(), updatedAt: new Date() }]} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/member/i)).toBeInTheDocument();

    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        roles: [
          { id: "r1", orgId, name: "member", description: null, scope: "ORG", permissions: {}, createdAt: new Date(), updatedAt: new Date() },
          { id: "r2", orgId, name: "manager", description: null, scope: "ORG", permissions: {}, createdAt: new Date(), updatedAt: new Date() },
        ]
      })),
    );

    await qc.invalidateQueries({ queryKey: ["org", orgId, "roles"] });

    await waitFor(() => expect(screen.getByText(/manager/i)).toBeInTheDocument(), { timeout: 20000 });
  });
});


