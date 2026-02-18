// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";
import type { PermissionResource } from "@/server/types/security-types";
import { createPermissionsTestQueryClient } from "./permissions-test-utils";

const orgId = "org-perm-delete-rollback";
const baseUrl = `/api/org/${orgId}/permissions`;

const db: { resources: PermissionResource[] } = {
  resources: [
    { id: "p1", orgId, resource: "org.test", actions: ["read"], description: null, createdAt: new Date(), updatedAt: new Date() },
    { id: "p2", orgId, resource: "org.temp", actions: ["read", "update"], description: null, createdAt: new Date(), updatedAt: new Date() }
  ]
};

describe("permissions optimistic delete – rollback on error", () => {
  it("restores the row if server delete fails", async () => {
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        resources: db.resources.map((resource) => ({
          ...resource,
          actions: [...resource.actions],
        }))
      })),
      http.delete(`${baseUrl}/p2`, () => HttpResponse.json({ message: 'fail' }, { status: 500 }))
    );

    const qc = createPermissionsTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={db.resources} />
      </QueryClientProvider>
    );

    const rowText = await screen.findByText(/org\.temp/);
    const container = rowText.closest('div.rounded-lg');
    if (!container) {
      throw new Error('Missing permission row');
    }
    const containerElement = container as HTMLElement;
    await userEvent.click(within(containerElement).getByRole('button', { name: /edit/i }));
    const delBtn = within(containerElement).getByRole('button', { name: /delete/i });
    await userEvent.click(delBtn);
    const confirm = await screen.findByRole('button', { name: /delete resource/i });
    await userEvent.click(confirm);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /delete resource/i })).not.toBeInTheDocument();
      expect(screen.getByText(/org\.temp/)).toBeInTheDocument();
    });
  });
});
