# Org Area – P0/P1 TODOs

- P0: Add React Query client wrappers for roles list, permissions list, members list so invalidations update UI without reload.
- P0: Convert /org/members page list to React Query client wrapper using new /api/org/[orgId]/members GET.
- P0: Wire memberKeys.list into members page and invalidate after actions/bulk.
- P0: Add query modules for org profile/branding and wire invalidations to header/details summary panels.
- P0: Add optimistic updates for payment method default/remove; rollback on error.
- P1: Introduce audit trail UI in org area (industry-standard): filterable security/audit log (actor, action, resource, time).
- P1: Member CSV export endpoint + button (observes current filters); stream download.
- P1: Security settings stubs: SSO (SAML/OIDC) config screen, enforced MFA toggle, SCIM provisioning placeholder.
- P1: Branding governance: theme policy with token allowlist + preview; tenant theme SSR via x-org-id.
- P1: Notification dropdown: ensure invalidations from HR/org actions propagate to dropdown queries.
- P1: Tests: add API route tests for permissions and members list; add client interaction tests for billing/roles.
- P0: URL-sync remaining filtered screens: HR notifications detail, compliance lists, onboarding lists; use nuqs for stable shareable URLs.
- P0: Replace any leftover router.refresh() callers with precise query invalidations (search key: router.refresh()).
- P0: Audit all /api/org/[orgId] routes to ensure thin adapters -> controllers -> services (no direct repo calls).
- P1: Add Top button to Audit Log (smooth scroll) and keyboard shortcut `g g` for jump-to-top.
- P1: Extend MSW tests to cover permission delete/update optimistic rollback; members delete.
- P1: Consider persisting filter UI prefs via Zustand stores (per-page), not server data.
