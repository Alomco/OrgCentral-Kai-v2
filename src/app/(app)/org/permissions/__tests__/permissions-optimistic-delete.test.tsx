// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";
import { permissionKeys } from "../_components/permissions.api";
import type { PermissionResource } from "@/server/types/security-types";
import { createPermissionsTestQueryClient } from "./permissions-test-utils";

const orgId = "org-perm-delete";
const baseUrl = `/api/org/${orgId}/permissions`;

const db: { resources: PermissionResource[] } = {
  resources: [
    { id: "p1", orgId, resource: "org.test", actions: ["read"], description: null, createdAt: new Date(), updatedAt: new Date() },
    { id: "p2", orgId, resource: "org.temp", actions: ["read", "update"], description: null, createdAt: new Date(), updatedAt: new Date() }
  ]
};

function createDeferred() {
  let resolve: (() => void) | undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });

  if (!resolve) {
    throw new Error("Deferred resolver was not initialized");
  }

  return { promise, resolve };
}

describe("permissions optimistic delete", () => {
  it("removes resource immediately and stays removed after invalidate", async () => {
    const deleteRequest = createDeferred();
    const transitionSequence: string[] = [];

    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        resources: db.resources.map((resource) => ({
          ...resource,
          actions: [...resource.actions],
        }))
      })),
      http.delete(`${baseUrl}/p2`, async () => {
        transitionSequence.push("request-started");
        await deleteRequest.promise;
        db.resources = db.resources.filter((resource) => resource.id !== "p2");
        transitionSequence.push("response-resolved");
        return HttpResponse.json({}, { status: 204 });
      })
    );

    const qc = createPermissionsTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={db.resources} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/org\.temp/)).toBeInTheDocument();

    // Click the delete trigger button in the org.temp row
    const row = screen.getByText(/org\.temp/).closest('div.rounded-lg');
    if (!row) {
      throw new Error('Missing permission row');
    }
    const rowElement = row as HTMLElement;
    await userEvent.click(within(rowElement).getByRole('button', { name: /edit/i }));
    const delBtn = within(rowElement).getByRole('button', { name: /delete/i });
    await userEvent.click(delBtn);

    // Confirm in dialog
    const confirm = await screen.findByRole('button', { name: /delete resource/i });
    await userEvent.click(confirm);

    // Optimistic removal
    await waitFor(() => {
      expect(screen.queryByText(/org\.temp/)).not.toBeInTheDocument();
    });
    expect(transitionSequence).toEqual(["request-started"]);
    deleteRequest.resolve();

    await qc.invalidateQueries({ queryKey: permissionKeys.list(orgId) });
    await waitFor(() => {
      expect(screen.queryByText(/org\.temp/)).not.toBeInTheDocument();
    });
    expect(transitionSequence).toEqual(["request-started", "response-resolved"]);
  });
});

