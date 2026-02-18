// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { RolesListClient } from "../_components/roles-list.client";
import { RoleCreateForm } from "../_components/role-create-form";
import type { RoleCreateState } from "../actions.state";
import type { Role } from "@/server/types/hr-types";

const { db, orgId } = vi.hoisted(() => {
  const orgId = "org-roles-create";
  return {
    orgId,
    db: {
      roles: [{ id: "r1", orgId, name: "member", description: null, scope: "ORG", permissions: {}, createdAt: new Date(), updatedAt: new Date() }] as Role[],
    },
  };
});
const baseUrl = `/api/org/${orgId}/roles`;

vi.mock("../actions", () => ({
  createRoleAction: vi.fn(async (_prev: RoleCreateState, formData: FormData) => {
    const name = typeof formData.get("name") === "string" ? String(formData.get("name")) : "";
    const description = typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
    db.roles.push({
      id: `r${db.roles.length + 1}`,
      orgId,
      name,
      description: description.length > 0 ? description : null,
      scope: "ORG",
      permissions: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { status: "success", message: "Role created." };
  }),
  updateRoleInlineAction: vi.fn(async () => ({ status: "success", message: "Role updated." })),
  deleteRoleInlineAction: vi.fn(async () => ({ status: "success", message: "Role deleted." })),
}));

describe("roles create flow", () => {
  it("creates and shows new role after mutation", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({ roles: [...db.roles] })),
      http.post(baseUrl, async ({ request }) => {
        const body = await request.json() as any;
        db.roles.push({
          id: "r2",
          orgId,
          name: body.name,
          description: body.description ?? null,
          scope: "ORG",
          permissions: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return HttpResponse.json({ role: db.roles[db.roles.length - 1] }, { status: 201 });
      })
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <div>
          <RoleCreateForm orgId={orgId} />
          <RolesListClient orgId={orgId} initial={db.roles} />
        </div>
      </QueryClientProvider>
    );

    expect(await screen.findByText(/member/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/Role name/i), "manager");
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await screen.findByText(/role created/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create/i })).toBeEnabled();
    });
    await waitFor(() => {
      expect(screen.getByText(/^manager$/i)).toBeInTheDocument();
    }, { timeout: 20000 });
  }, 30000);
});

