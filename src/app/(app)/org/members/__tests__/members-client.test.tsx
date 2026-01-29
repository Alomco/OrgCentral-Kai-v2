// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { MembersListClient } from "../_components/members-list.client";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/members`;

const initial = { users: [{ id: "u1", email: "a@example.com", displayName: "Alice", roles: ["member"], memberships: [{ organizationId: orgId, roles: ["member"], status: "ACTIVE" }] }], totalCount: 1, page: 1, pageSize: 25 };

describe("MembersListClient invalidation", () => {
  it("updates after invalidateQueries", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json(initial)),
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MembersListClient orgId={orgId} currentQueryKey="" initial={initial} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Alice/)).toBeInTheDocument();

    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ ...initial, users: [...initial.users, { id: "u2", email: "b@example.com", displayName: "Bob", roles: ["member"], memberships: [{ organizationId: orgId, roles: ["member"], status: "ACTIVE" }] }] })),
    );

    await qc.invalidateQueries({ queryKey: ["org", orgId, "members", ""] });

    await waitFor(async () => expect(await screen.findByText(/Bob/)).toBeInTheDocument());
  });
});

