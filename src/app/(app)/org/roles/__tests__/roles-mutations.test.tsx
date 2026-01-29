// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { RolesListClient } from "../_components/roles-list.client";
import { RoleCreateForm } from "../_components/role-create-form";

const orgId = "org1";
const baseUrl = `/api/org/${orgId}/roles`;

const db = { roles: [{ id: "r1", name: "member", description: null, permissions: {} }] } as any;

describe("roles create flow", () => {
  it("creates and shows new role after mutation", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ roles: db.roles })),
      http.post(baseUrl, async ({ request }) => {
        const body = await request.json() as any;
        db.roles.push({ id: "r2", name: body.name, description: body.description ?? null, permissions: {} });
        return HttpResponse.json({ role: db.roles[db.roles.length - 1] }, { status: 201 });
      })
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <div>
          <RoleCreateForm orgId={orgId} />
          <RolesListClient orgId={orgId} initial={db.roles as any} />
        </div>
      </QueryClientProvider>
    );

    expect(await screen.findByText(/member/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/Role name/i), "manager");
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(async () => expect(await screen.findByText(/manager/i)).toBeInTheDocument());
  });
});

