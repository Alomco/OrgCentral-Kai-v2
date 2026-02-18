// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { PermissionResourceManager } from "../_components/permission-resource-manager";
import { permissionKeys } from "../_components/permissions.api";
import type { PermissionResource } from "@/server/types/security-types";
import { createPermissionsTestQueryClient } from "./permissions-test-utils";

const orgId = "org-perm-update";
const baseUrl = `/api/org/${orgId}/permissions`;

const seed = (): PermissionResource[] => ([{ id: "p1", orgId, resource: "org.test", actions: ["read"], description: "Old", createdAt: new Date(), updatedAt: new Date() }]);

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

describe("permissions optimistic update", () => {
  it("updates row instantly and persists after re-fetch", async () => {
    const resources = seed();
    const updateRequest = createDeferred();
    const transitionSequence: string[] = [];

    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        resources: resources.map((resource) => ({
          ...resource,
          actions: [...resource.actions],
        }))
      })),
      http.put(`${baseUrl}/p1`, async ({ request }) => {
        transitionSequence.push("request-started");
        await updateRequest.promise;
        const body = await request.json() as { resource?: string; actions?: string[]; description?: string | null };
        resources[0] = { ...resources[0], ...body, actions: body.actions ?? resources[0].actions, updatedAt: new Date() };
        transitionSequence.push("response-resolved");
        return HttpResponse.json({ resource: resources[0] }, { status: 200 });
      })
    );

    const qc = createPermissionsTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={resources} />
      </QueryClientProvider>
    );

    const row = (await screen.findByText(/org\.test/)).closest('div.rounded-lg');
    if (!row) {
      throw new Error('Missing permission row');
    }

    // Edit description inline (open the row form and change field)
    const rowElement = row as HTMLElement;
    await userEvent.click(within(rowElement).getByRole('button', { name: /edit/i }));
    const desc = await within(rowElement).findByLabelText(/Description/i);
    await userEvent.clear(desc);
    await userEvent.type(desc, "Updated");
    await userEvent.click(within(rowElement).getByRole('button', { name: /save/i }));

    // The row shows the update without waiting for re-fetch
    await screen.findByText("Updated", { selector: 'p' });
    expect(transitionSequence).toEqual(["request-started"]);
    await act(async () => {
      updateRequest.resolve();
      await updateRequest.promise;
    });

    // Invalidate then ensure it still shows
    await qc.invalidateQueries({ queryKey: permissionKeys.list(orgId) });
    await waitFor(() => {
      expect(screen.getByText("Updated", { selector: 'p' })).toBeInTheDocument();
    });
    expect(transitionSequence).toEqual(["request-started", "response-resolved"]);
  });

  it("rolls back on update error", async () => {
    const resources = seed();
    server.resetHandlers(
      http.get(baseUrl, () => HttpResponse.json({
        resources: resources.map((resource) => ({
          ...resource,
          actions: [...resource.actions],
        }))
      })),
      http.put(`${baseUrl}/p1`, async () => HttpResponse.json({ message: "fail" }, { status: 500 }))
    );

    const qc = createPermissionsTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <PermissionResourceManager orgId={orgId} resources={resources} />
      </QueryClientProvider>
    );

    const row = (await screen.findByText(/org\.test/)).closest('div.rounded-lg');
    if (!row) {
      throw new Error('Missing permission row');
    }
    expect(screen.getByText("Old")).toBeInTheDocument();

    const rowElement = row as HTMLElement;
    await userEvent.click(within(rowElement).getByRole('button', { name: /edit/i }));
    const desc = await within(rowElement).findByLabelText(/Description/i);
    await userEvent.clear(desc);
    await userEvent.type(desc, "Updated");
    await userEvent.click(within(rowElement).getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText("Old", { selector: 'p' })).toBeInTheDocument();
    });
  });
});

