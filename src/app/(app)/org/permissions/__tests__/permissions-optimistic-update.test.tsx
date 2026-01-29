// @vitest-environment jsdom
import { describe, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/permissions`;

const start = [{ id: "p1", resource: "org.test", actions: ["read"], description: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];

describe("permissions optimistic update", () => {
  it("updates row instantly and persists after re-fetch", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ resources: start })),
      http.put(`${baseUrl}/p1`, async ({ request }) => {
        const body = await request.json() as any;
        start[0] = { ...start[0], ...body, actions: body.actions ?? start[0].actions, updatedAt: new Date().toISOString() };
        return HttpResponse.json({ resource: start[0] }, { status: 200 });
      })
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={start as any} />
      </QueryClientProvider>
    );

    await screen.findByText(/org\.test/);

    // Edit description inline (open the row form and change field)
    const desc = await screen.findByLabelText(/Description/i);
    await userEvent.clear(desc);
    await userEvent.type(desc, "Updated");
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    // The row shows the update without waiting for re-fetch
    await screen.findByText(/Updated/);

    // Invalidate then ensure it still shows
    await qc.invalidateQueries({ queryKey: ["org", orgId, "permissions"] });
    await waitFor(async () => { await screen.findByText(/Updated/); });
  });
});

