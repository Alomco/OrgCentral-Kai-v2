"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCcw, Shield, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DebugSecurityResponse } from "./DevelopmentSecurityWidget.types";
import { copyToClipboard, DEBUG_TITLE, TOAST_LONG_MS, TOAST_SHORT_MS, truncateId } from "./DevelopmentSecurityWidget.helpers";
import {
  renderAbacSection,
  renderAuthorizationSection,
  renderOrganizationsSection,
  renderRbacSection,
  renderSessionSection,
  renderTools,
} from "./DevelopmentSecurityWidget.sections";

export function DevelopmentSecurityWidget() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<DebugSecurityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDevelopment = process.env.NODE_ENV === "development";

  const fetchSecurity = useCallback(async () => {
    if (!isDevelopment) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/debug/security", { cache: "no-store" });
      const body: unknown = await response.json().catch(() => null);
      if (body && typeof body === "object") {
        setPayload(body as DebugSecurityResponse);
      } else {
        setPayload(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isDevelopment]);

  const summary = useMemo(() => {
    if (!payload?.ok) {
      return DEBUG_TITLE;
    }
    if (!payload.authenticated) {
      return "Not signed in";
    }
    const role = payload.authorization?.roleKey ?? "unknown-role";
    const org = payload.authorization?.orgId ?? payload.session.session.activeOrganizationId ?? null;
    return `${role} | org ${truncateId(org)}`;
  }, [payload]);

  const collapsedBadge = useMemo(() => {
    if (!payload?.ok || !payload.authenticated) {
      return null;
    }
    const role = payload.authorization?.roleKey ?? "unknown";
    const variant = payload.authorization?.developmentSuperAdmin ? "destructive" : "secondary";
    return <Badge variant={variant}>{role}</Badge>;
  }, [payload]);

  const handleToggle = useCallback(() => {
    setOpen((previous) => {
      const next = !previous;
      if (next) {
        fetchSecurity().catch(() => {
          setToast("Failed to load security context");
        });
      }
      return next;
    });
  }, [fetchSecurity]);

  const handleCopyJson = useCallback(async () => {
    if (!payload) {
      return;
    }
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2));
    setToast(ok ? "Copied debug JSON" : "Clipboard blocked");
    window.setTimeout(() => setToast(null), TOAST_LONG_MS);
  }, [payload]);

  const handleCopyValue = useCallback(async (value: string) => {
    const ok = await copyToClipboard(value);
    setToast(ok ? "Copied" : "Clipboard blocked");
    window.setTimeout(() => setToast(null), TOAST_SHORT_MS);
  }, []);

  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-background/95 text-foreground shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold">Dev security</div>
                {payload?.ok && payload.authenticated && payload.authorization?.developmentSuperAdmin ? (
                  <Badge variant="destructive">super</Badge>
                ) : null}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{summary}</div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={fetchSecurity}
                disabled={isLoading}
                aria-label="Refresh security context"
              >
                <RefreshCcw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator />
          <div className="max-h-[65vh] space-y-4 overflow-auto px-4 py-3 text-xs">
            {payload?.ok && payload.authenticated ? (
              <>
                {payload.warning ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                    {payload.warning}
                  </div>
                ) : null}

                {renderSessionSection(payload, handleCopyValue)}
                {renderAuthorizationSection(payload.authorization, handleCopyValue)}
                {renderAbacSection(payload)}
                {renderRbacSection(payload)}
                {renderOrganizationsSection(payload.organizations, handleCopyValue)}
                {renderTools(handleCopyJson, toast)}
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Not signed in</div>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/login">Go to login</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" size="sm" className="rounded-full shadow-lg" onClick={handleToggle}>
          <Shield className="h-4 w-4" />
          <span>Security</span>
          {collapsedBadge ? <span className="ml-1">{collapsedBadge}</span> : null}
        </Button>
      )}
    </div>
  );
}
