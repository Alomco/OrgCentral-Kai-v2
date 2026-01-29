// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../test/msw-setup";
import { AuditLogClient } from "../_components/audit-log-client";

const orgId = "org1";

function makeLog(id: string) {
  return { id, eventType: 'ACCESS', action: 'read', resource: 'org.resource', resourceId: null, userId: null, createdAt: new Date().toISOString() };
}

describe("audit infinite list", () => {
  it("appends more pages and shows No More", async () => {
    server.resetHandlers(
      http.get(`/api/org/${orgId}/audit/logs`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');
        if (!cursor) {
          return HttpResponse.json({ logs: [makeLog('1'), makeLog('2')], nextCursor: 'c2' });
        }
        if (cursor === 'c2') {
          return HttpResponse.json({ logs: [makeLog('3')], nextCursor: undefined });
        }
        return HttpResponse.json({ logs: [] });
      })
    );

    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <AuditLogClient orgId={orgId} />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Load More/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /load more/i }));

    await waitFor(async () => {
      expect(await screen.findByText('No More')).toBeInTheDocument();
      expect(screen.getByText(/org.resource/)).toBeInTheDocument();
    });
  });
});

