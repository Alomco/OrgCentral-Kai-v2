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

describe("permissions optimistic delete", () => {
  it("removes resource immediately and stays removed after invalidate", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ resources: db.resources })),
      http.delete(`${baseUrl}/p2`, () => {
        db.resources = db.resources.filter((r: any) => r.id !== "p2");
        return HttpResponse.json({}, { status: 204 });
      })
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={db.resources as any} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/org\.temp/)).toBeInTheDocument();

    // Click the delete trigger button in the org.temp row
    const row = screen.getByText(/org\.temp/).closest('div')!;
    const delBtn = within(row).getByRole('button', { name: /delete/i });
    await userEvent.click(delBtn);

    // Confirm in dialog
    const confirm = await screen.findByRole('button', { name: /delete resource/i });
    await userEvent.click(confirm);

    // Optimistic removal
    await waitFor(() => expect(screen.queryByText(/org\.temp/)).not.toBeInTheDocument());

    await qc.invalidateQueries({ queryKey: ["org", orgId, "permissions"] });
    await waitFor(() => expect(screen.queryByText(/org\.temp/)).not.toBeInTheDocument());
  });
});

