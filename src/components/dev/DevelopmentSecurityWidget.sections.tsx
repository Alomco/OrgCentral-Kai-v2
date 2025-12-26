"use client";

import Link from "next/link";
import { Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DebugSecurityResponseAuthenticated } from "./DevelopmentSecurityWidget.types";
import { truncateId } from "./DevelopmentSecurityWidget.helpers";

export function renderSessionSection(payload: DebugSecurityResponseAuthenticated, onCopy: (value: string) => void) {
  return (
    <section className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Session</div>
      <div className="space-y-1 rounded-xl border bg-background/60 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">User</span>
          <span className="truncate font-medium">{payload.session.user.email ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">User ID</span>
          <button
            type="button"
            className="font-mono text-[11px] underline underline-offset-2"
            onClick={() => onCopy(payload.session.user.id)}
          >
            {truncateId(payload.session.user.id)}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Active org</span>
          <span className="font-mono text-[11px]">{truncateId(payload.session.session.activeOrganizationId)}</span>
        </div>
      </div>
    </section>
  );
}

export function renderAuthorizationSection(
  authorization: DebugSecurityResponseAuthenticated["authorization"],
  onCopy: (value: string) => void,
) {
  if (!authorization) {
    return null;
  }
  return (
    <section className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Authorization</div>
      <div className="space-y-1 rounded-xl border bg-background/60 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{authorization.roleKey}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Org ID</span>
          <button
            type="button"
            className="font-mono text-[11px] underline underline-offset-2"
            onClick={() => onCopy(authorization.orgId)}
          >
            {truncateId(authorization.orgId)}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Residency</span>
          <span className="font-medium">{authorization.dataResidency}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Classification</span>
          <span className="font-medium">{authorization.dataClassification}</span>
        </div>
      </div>
    </section>
  );
}

export function renderAbacSection(payload: DebugSecurityResponseAuthenticated) {
  if (!payload.abac) {
    return null;
  }
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">ABAC</div>
        <Badge variant={payload.abac.usingFallbackPolicies ? "outline" : "secondary"}>
          {payload.abac.policyCount} policies
        </Badge>
      </div>
      <div className="rounded-xl border bg-background/60 px-3 py-2">
        <div className="text-muted-foreground">
          {payload.abac.usingFallbackPolicies ? "Using fallback policies (dev bootstrap)." : "Using tenant-configured policies."}
        </div>
        <div className="mt-2 space-y-1 font-mono text-[11px]">
          {payload.abac.policies.slice(0, 5).map((policy) => (
            <div key={policy.id} className="truncate">
              {policy.effect.toUpperCase()} {policy.id}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function renderRbacSection(payload: DebugSecurityResponseAuthenticated) {
  const statements = payload.rbac?.roleStatements;
  if (!statements) {
    return null;
  }
  return (
    <section className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">RBAC</div>
      <div className="space-y-2 rounded-xl border bg-background/60 px-3 py-2">
        {Object.entries(statements).map(([resource, actions]) => (
          <div key={resource} className="flex items-start justify-between gap-3">
            <div className="font-mono text-[11px] text-muted-foreground">{resource}</div>
            <div className="text-right font-mono text-[11px]">{actions.join(", ")}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function renderOrganizationsSection(
  organizations: DebugSecurityResponseAuthenticated["organizations"],
  onCopy: (value: string) => void,
) {
  if (!organizations?.length) {
    return null;
  }
  return (
    <section className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Organizations</div>
      <div className="space-y-1 rounded-xl border bg-background/60 px-3 py-2">
        {organizations.map((org) => (
          <div key={org.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-medium">{org.name}</div>
              <div className="truncate font-mono text-[11px] text-muted-foreground">{org.slug}</div>
            </div>
            <button
              type="button"
              className="font-mono text-[11px] underline underline-offset-2"
              onClick={() => onCopy(org.id)}
            >
              {truncateId(org.id)}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function renderTools(onCopyJson: () => void, toast: string | null) {
  return (
    <section className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tools</div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/admin-signup">Admin bootstrap</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onCopyJson}>
          <Copy className="h-4 w-4" />
          Copy JSON
        </Button>
      </div>
      {toast ? <div className="text-[11px] text-muted-foreground">{toast}</div> : null}
    </section>
  );
}
