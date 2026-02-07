"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCcw, Shield, X } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { copyToClipboard, DEBUG_TITLE, TOAST_LONG_MS, TOAST_SHORT_MS, truncateId } from "./DevelopmentSecurityWidget.helpers";
import {
  renderAbacSection,
  renderAuthorizationSection,
  renderOrganizationsSection,
  renderRbacSection,
  renderSessionSection,
  renderTools,
} from "./DevelopmentSecurityWidget.sections";
import { useRegisterDevelopmentAction } from "./toolbar";
import { devSecurityKeys, fetchDevelopmentSecurity } from "./dev-security.api";

export function DevelopmentSecurityWidget() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutReference = useRef<number | null>(null);

  useEffect(() => () => {
    if (toastTimeoutReference.current !== null) {
      window.clearTimeout(toastTimeoutReference.current);
      toastTimeoutReference.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, durationMs: number) => {
    if (toastTimeoutReference.current !== null) {
      window.clearTimeout(toastTimeoutReference.current);
    }
    setToast(message);
    toastTimeoutReference.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutReference.current = null;
    }, durationMs);
  }, []);

  const isDevelopment = process.env.NODE_ENV === "development";

  const { data, refetch } = useQuery({
    queryKey: devSecurityKeys.detail(),
    queryFn: fetchDevelopmentSecurity,
    enabled: false,
    gcTime: 0,
    staleTime: 0,
  });

  const payload = data ?? null;

  const fetchSecurity = useCallback(async () => {
    if (!isDevelopment) {
      return;
    }
    setIsLoading(true);
    try {
      await refetch();
    } catch {
      setToast("Failed to load security context");
    } finally {
      setIsLoading(false);
    }
  }, [isDevelopment, refetch]);

  // Register with DevToolbar
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

  const handleCopyJson = useCallback(async () => {
    if (!payload) {
      return;
    }
    const ok = await copyToClipboard(JSON.stringify(payload, null, 2));
    showToast(ok ? "Copied debug JSON" : "Clipboard blocked", TOAST_LONG_MS);
  }, [payload, showToast]);

  const handleCopyValue = useCallback(async (value: string) => {
    const ok = await copyToClipboard(value);
    showToast(ok ? "Copied" : "Clipboard blocked", TOAST_SHORT_MS);
  }, [showToast]);

  const component = useMemo(() => {
    if (!isDevelopment) {
      return null;
    }

    return (
      <div className="fixed bottom-4 right-20 z-(--z-dev-widget) animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-card text-foreground shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-semibold">Dev security</div>
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
      </div>
    );
  }, [summary, payload, isLoading, toast, fetchSecurity, handleCopyValue, handleCopyJson, isDevelopment]); // handlers are stable

  const action = useMemo(() => ({
    id: "security",
    label: "Security",
    icon: <Shield className="h-4 w-4" />,
    onClick: handleToggle,
    isActive: open,
    order: 10,
    component,
    disabled: !isDevelopment
  }), [handleToggle, open, component, isDevelopment]);

  useRegisterDevelopmentAction(action);

  // No render
  return null;
}
