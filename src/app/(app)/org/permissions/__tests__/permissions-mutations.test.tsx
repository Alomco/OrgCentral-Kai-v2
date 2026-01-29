// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";
import { PermissionResourceCreateForm } from "../_components/permission-resource-create-form";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/permissions`;

const db = { resources: [{ id: "p1", resource: "org.test", actions: ["read"], description: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] } as any;

describe("permissions create flow", () => {
  it("creates and shows new resource after mutation", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ resources: db.resources })),
      http.post(baseUrl, async ({ request }) => {
        const body = await request.json() as any;
        const rec = { id: `p${db.resources.length+1}`, resource: body.resource, actions: body.actions, description: body.description ?? null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        db.resources.push(rec);
        return HttpResponse.json({ resource: rec }, { status: 201 });
      })
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <div>
          <PermissionResourceCreateForm orgId={orgId} />
          <PermissionResourceManager orgId={orgId} resources={db.resources as any} />
        </div>
      </QueryClientProvider>
    );

    expect(await screen.findByText(/org\.test/)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/hr\.leave\.request|hr\.leave\.request/i), "org.new");
    await userEvent.type(screen.getByPlaceholderText(/read|read/i), "read");
    await userEvent.click(screen.getByRole("button", { name: /create resource/i }));

    await waitFor(async () => expect(await screen.findByText(/org\.new/)).toBeInTheDocument());
  });
});

