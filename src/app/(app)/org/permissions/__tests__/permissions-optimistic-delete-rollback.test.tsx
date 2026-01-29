// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/permissions`;

const db = { resources: [
  { id: "p1", resource: "org.test", actions: ["read"], description: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "p2", resource: "org.temp", actions: ["read","update"], description: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
] } as any;

describe("permissions optimistic delete – rollback on error", () => {
  it("restores the row if server delete fails", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ resources: db.resources })),
      http.delete(`${baseUrl}/p2`, () => HttpResponse.json({ message: 'fail' }, { status: 500 }))
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={db.resources as any} />
      </QueryClientProvider>
    );

    const row = await screen.findByText(/org\.temp/);
    const container = row.closest('div')!;
    const delBtn = within(container).getByRole('button', { name: /delete/i });
    await userEvent.click(delBtn);
    const confirm = await screen.findByRole('button', { name: /delete resource/i });
    await userEvent.click(confirm);

    // optimistic removal
    await waitFor(() => expect(screen.queryByText(/org\.temp/)).not.toBeInTheDocument());

    // rollback sets it back
    await waitFor(() => expect(screen.getByText(/org\.temp/)).toBeInTheDocument());
  });
});
