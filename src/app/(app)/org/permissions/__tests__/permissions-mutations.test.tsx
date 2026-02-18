// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";
import type { PermissionResourceCreateState } from "../permission-resource-form-utils";
import type { PermissionResource } from "@/server/types/security-types";
import { createPermissionsTestQueryClient } from "./permissions-test-utils";

const { db, orgId } = vi.hoisted(() => {
  const orgId = "org-perm-create";
  return {
    orgId,
    db: {
      resources: [{
        id: "p1",
        orgId,
        resource: "org.test",
        actions: ["read"],
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }] as PermissionResource[],
    },
  };
});
const baseUrl = `/api/org/${orgId}/permissions`;

vi.mock("../permission-resource-actions", () => ({
  createPermissionResourceAction: vi.fn(async (_prev: PermissionResourceCreateState, formData: FormData) => {
    const resource = typeof formData.get("resource") === "string" ? String(formData.get("resource")) : "";
    const actionsRaw = typeof formData.get("actions") === "string" ? String(formData.get("actions")) : "";
    const description = typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
    const actions = actionsRaw
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    db.resources.push({
      id: `p${db.resources.length + 1}`,
      orgId,
      resource,
      actions,
      description: description.length > 0 ? description : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      status: "success",
      message: "Permission resource created.",
      values: { resource: "", actions: "", description: "" },
    };
  }),
}));

describe("permissions create flow", () => {
  it("creates and shows new resource after mutation", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        resources: db.resources.map((resource) => ({
          ...resource,
          actions: [...resource.actions],
        }))
      })),
    );

    const qc = createPermissionsTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={db.resources} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/org\.test/)).toBeInTheDocument();

    const createHeading = screen.getByText(/add resource/i);
    const createForm = createHeading.closest('form');
    if (!createForm) {
      throw new Error('Missing create form');
    }
    await userEvent.type(within(createForm).getByRole('textbox', { name: /resource key/i }), "org.new");
    await userEvent.type(within(createForm).getByRole('textbox', { name: /allowed actions/i }), "read");
    await userEvent.click(within(createForm).getByRole("button", { name: /create resource/i }));

    await waitFor(() => expect(screen.getByText(/org\.new/)).toBeInTheDocument(), { timeout: 15000 });
  });
});

