// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { MembersListClient } from "../_components/members-list.client";

const orgId = "org1";
const listUrl = `/api/org/${orgId}/members`;
const memberUrl = (u: string) => `/api/org/${orgId}/membership/${u}`;

const initial = { users: [{ id: "u1", email: "a@example.com", displayName: "Alice", roles: ["member"], memberships: [{ organizationId: orgId, roles: ["member"], status: "ACTIVE" }] }], totalCount: 1, page: 1, pageSize: 25 } as any;

let status: 'ACTIVE'|'SUSPENDED' = 'ACTIVE';

server.use(
  http.get(listUrl, () => HttpResponse.json({ ...initial, users: [{...initial.users[0], memberships: [{ organizationId: orgId, roles: ["member"], status }]}] })),
  http.put(memberUrl('u1'), async ({ request }) => {
    const body = await request.json() as any;
    status = body.status || status;
    return HttpResponse.json({ ok: true });
  })
);

describe("members suspend flow", () => {
  it("suspends and shows updated status after invalidation", async () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MembersListClient orgId={orgId} currentQueryKey="" initial={initial} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Status: ACTIVE/)).toBeInTheDocument();

    // Click first member's Suspend button
    const suspend = await screen.findByRole('button', { name: /suspend/i });
    await userEvent.click(suspend);

    await waitFor(async () => expect(await screen.findByText(/Status: SUSPENDED/)).toBeInTheDocument());
  });
});

