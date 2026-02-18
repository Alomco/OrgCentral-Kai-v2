// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { MembersListClient } from "../_components/members-list.client";
import { memberKeys, membersSearchKey } from "../_components/members.api";
import type { UserData } from "@/server/types/leave-types";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/members`;

const timestamp = new Date().toISOString();
const initial: { users: UserData[]; totalCount: number; page: number; pageSize: number } = {
  users: [{
    id: "u1",
    email: "a@example.com",
    displayName: "Alice",
    roles: ["member"],
    memberships: [{ organizationId: orgId, organizationName: "Org One", roles: ["member"], status: "ACTIVE" }],
    memberOf: [orgId],
    createdAt: timestamp,
    updatedAt: timestamp,
  }],
  totalCount: 1,
  page: 1,
  pageSize: 25,
};

describe("MembersListClient invalidation", () => {
  it("updates after invalidateQueries", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json(initial)),
    );

    const qc = new QueryClient();
    const params = new URLSearchParams({ pageSize: "25" });
    const query = params.toString();
    const key = membersSearchKey(params);
    render(
      <QueryClientProvider client={qc}>
        <MembersListClient orgId={orgId} currentQueryKey={query} initial={initial} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Alice/)).toBeInTheDocument();

    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        ...initial,
        users: [...initial.users, {
          id: "u2",
          email: "b@example.com",
          displayName: "Bob",
          roles: ["member"],
          memberships: [{ organizationId: orgId, organizationName: "Org One", roles: ["member"], status: "ACTIVE" }],
          memberOf: [orgId],
          createdAt: timestamp,
          updatedAt: timestamp,
        }],
      })),
    );

    await qc.invalidateQueries({ queryKey: memberKeys.list(orgId, key) });

    await waitFor(() => {
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    }, { timeout: 20000 });
  }, 30000);
});

