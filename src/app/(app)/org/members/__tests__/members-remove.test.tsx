// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { MembersListClient } from "../_components/members-list.client";

const orgId = 'org1';
const baseUrl = `/api/org/${orgId}/members`;
const putUrl = (userId: string) => `/api/org/${orgId}/membership/${userId}`;

const users = [
  { id: 'u1', email: 'a@example.com', displayName: 'A', roles: ['member'], memberships: [{ organizationId: orgId, roles: ['member'], status: 'ACTIVE' }] },
  { id: 'u2', email: 'b@example.com', displayName: 'B', roles: ['member'], memberships: [{ organizationId: orgId, roles: ['member'], status: 'ACTIVE' }] },
];

function renderList(query: string) {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MembersListClient
        orgId={orgId}
        currentQueryKey={query}
        initial={{ users, totalCount: 2, page: 1, pageSize: 25 }}
      />
    </QueryClientProvider>
  );
  return qc;
}

describe('members remove from org', () => {
  it('optimistically removes and stays removed (status=ACTIVE filter)', async () => {
    const query = new URLSearchParams({ status: 'ACTIVE', page: '1', pageSize: '25' }).toString();

    server.resetHandlers(
      http.get(`${baseUrl}?${query}`, () => HttpResponse.json({ users, totalCount: 2, page: 1, pageSize: 25 })),
      http.put(putUrl('u2'), async () => HttpResponse.json({ success: true }, { status: 200 }))
    );

    const qc = renderList(query);

    expect(await screen.findByText('B')).toBeInTheDocument();

    const btns = await screen.findAllByRole('button', { name: /remove from org/i }); await userEvent.click(btns[btns.length-1]);

    await waitFor(() => expect(screen.queryByText('B')).not.toBeInTheDocument());

    await qc.invalidateQueries({ queryKey: ['org', orgId, 'members', query] });
    await waitFor(() => expect(screen.queryByText('B')).not.toBeInTheDocument());
  });

  it('rolls back on error', async () => {
    const query = new URLSearchParams({ status: 'ACTIVE', page: '1', pageSize: '25' }).toString();

    server.resetHandlers(
      http.get(`${baseUrl}?${query}`, () => HttpResponse.json({ users, totalCount: 2, page: 1, pageSize: 25 })),
      http.put(putUrl('u2'), async () => HttpResponse.json({ message: 'fail' }, { status: 500 }))
    );

    renderList(query);

    expect(await screen.findByText('B')).toBeInTheDocument();

    const btns = await screen.findAllByRole('button', { name: /remove from org/i }); await userEvent.click(btns[btns.length-1]);

    // optimistic removal then rollback
    await waitFor(() => expect(screen.queryByText('B')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('B')).toBeInTheDocument());
  });
});




