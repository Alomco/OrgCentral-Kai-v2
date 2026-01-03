# UI/UX Gap Analysis & Improvement Plan

**Date:** January 2, 2026
**Target System:** `orgcentral` (Next.js 16)
**Status:** **Re-Verified (Post-Changes)**

This document outlines the findings from a comprehensive UI/UX and architectural review of the `orgcentral` application, updated after recent code changes.

## 0. Platform & UX Foundations (Cross-Cutting)

### Issues
*   **Server Components First (High):** No explicit rule set ensures server-first composition; `use client` can creep into shared UI and block streaming.
*   **Caching Strategy (High):** No consistent use of component caching with `cacheLife` and `cacheTag`; invalidation is not standardized by org or module.
*   **Streaming & PPR (Medium):** Partial Prerendering and nested `Suspense` are not used as a baseline, leading to coarse loading states.
*   **Typed Boundaries (High):** Zod schemas are not standardized at form/API boundaries; server actions are not typed via `useActionState`.
*   **Design Tokens (Medium):** Tailwind v4 tokens and `class-variance-authority` are not applied consistently, weakening theme cohesion.
*   **Theming & UI Engine (Medium):** No unified theming layer to map brand tokens to components and surfaces.
*   **Motion System (Low):** Motion is ad-hoc; there are no motion tokens or reduced-motion fallbacks.
*   **Architecture Guardrails (High):** SRP/ISP/DIP usage is inconsistent; DI is limited; extension points and Liskov-safe interfaces are not defined.
*   **Zero-Trust Tenant Scoping (Critical):** orgId, residency, and classification are not enforced as a first-class contract across UI/server actions.

### Recommendations
1.  **Server-First Composition:** Document and lint a default server component policy; isolate client islands behind stable boundary components.
2.  **Cache Plan:** Cache heavy data reads at the component layer; use `cacheLife` for TTL and `cacheTag` for org-scoped invalidation.
3.  **Streaming Baseline:** Adopt PPR for shells and nested `Suspense` for widgets/filters with layout-accurate skeletons.
4.  **Typed Boundaries:** Require Zod schemas for form inputs and API payloads; model server actions with `useActionState` and typed results.
5.  **Tokenized UI Engine:** Centralize Tailwind v4 tokens + CVA variants; expose theme extension points per module.
6.  **Motion Tokens:** Define CSS motion tokens and reduced-motion styles; implement CSS-first transitions in core components.
7.  **SOLID + DI:** Formalize service interfaces with DIP; inject data/side-effect services; publish Open/Closed extension points.
8.  **Zero-Trust Scoping:** Enforce orgId/residency/classification on every server boundary with explicit validation.

## 1. Dashboard Module (`src/app/(app)/dashboard`)

### Issues
*   **Performance (Medium):** The main waterfall has been wrapped in `getSessionContextOrRedirect`, which improves code cleanliness but still executes session retrieval and authorization sequentially.
    *   *Update:* The critical "waterfall" in the page component itself is cleaner, but the underlying service could still be optimized.
*   **Visual Polish (Resolved):** `DashboardWidgetSkeleton` now uses `glass-card` styles and gradients, matching the actual widgets. No more flickering.
*   **Layout (Medium):** The monotonous grid layout lacks hierarchy. "Coming Soon" and "Locked" cards clutter the view.
*   **Architecture (Low):** Redundant authorization checks within each widget increase latency.

### Recommendations
1.  **Dynamic Layout:** Implement a "Hero" widget for key metrics and use a Feature Flag system to hide "Coming Soon" modules.
2.  **Optimized Auth:** Pass a pre-validated context to widgets to avoid redundant DB calls.

## 2. HR Module (`src/app/(app)/hr`)

### Issues
*   **Interactivity (Resolved):** `useTransition` is now used in `employees-directory-filters.tsx`, making filtering smoother.
*   **Data Presentation (Resolved):** Pagination has been implemented via `EmployeesDirectoryPagination`.
*   **Navigation (High):** Editing employees still requires full page transitions. This disrupts the user flow.
*   **Feedback (Medium):** Lack of "Optimistic UI" for mutations (e.g., updating employee details).

### Recommendations
1.  **Adopt Drawers:** Use Side-sheets (Drawers) for "Quick Edit" and "Quick View" of employee details to maintain context.
2.  **Optimistic Updates:** Implement `useOptimistic` for all toggle/edit actions to provide instant feedback.
3.  **Debounce Search:** Add debouncing to the search filter if not already present.

## 3. Auth Module (`src/features/auth`)

### Issues
*   **Architecture (Resolved):** Credential login now correctly uses `authClient.signIn.email`, unifying the authentication flow.
*   **UX Complexity (Medium):** "Advanced Options" (Data Region, Security Level) in the login form are confusing for standard users.
*   **State Management (Medium):** Admin bootstrap relies on fragile `sessionStorage`.
*   **Code Quality (Low):** Duplication of UI components (`InputField`) within the form file.

### Recommendations
1.  **Simplify UI:** Hide "Advanced Options" behind a clear toggle or add tooltips.
2.  **Centralize Components:** Move local form components to `src/components/ui` or `src/features/auth/components`.

## 4. Org & Admin Modules (`src/app/(app)/org`, `src/app/(admin)`)

### Issues
*   **Scalability (Resolved):** The "Members" list (`org/members/page.tsx`) now uses server-side pagination with tenant scoping.
*   **Search & Filters (Resolved):** Members now supports search, role/status filters, and page-size controls with query sync.
*   **Member Management Enhancements (Resolved):** Sorting, bulk actions, select-all controls, confirmations, and audit logging are now available for roles and suspensions.
*   **Org Settings Enforcement (Resolved):** Security/session policies, notification delivery gating, and billing cadence/email/auto-renew handling now apply in runtime flows.
*   **Security Controls UI (Resolved):** IP allowlist entries can be managed in org settings; allowlist cannot be enabled without entries.
*   **Org Profile (Resolved):** Profile page is now editable with audit logging and cache invalidation.
*   **Billing Ops (Resolved):** Billing cadence/auto-renew updates now sync to Stripe subscriptions.
*   **Permissions UI (Resolved):** `/org/permissions` now includes ABAC summary, permission registry CRUD, and a legacy mapping checklist.
*   **Permissions UI Smoke (Pending):** Code-level smoke check shows ABAC summary link to `/org/abac` and CRUD scaffolding; need runtime validation of create/update/delete flows and error states.

### Recommendations
1.  **Editable Profile (Done):** Profile form now supports edits with audit logging and cache invalidation.
2.  **Billing Ops (Done):** Billing cadence/auto-renew changes now sync to Stripe subscriptions.
3.  **Admin UX Depth:** Add audit log view and bulk actions for org settings changes.

---

**Next Priority:**
**Finish legacy permission migration/coverage validation; tackle P2 items (team timesheet view, notification defaults/digest).**

## Appendix A. Cross-Cutting Implementation Checklist

### Priority Order (Dependency/Execution)
1.  **P0:** Org members pagination + tenant scoping (DONE).
2.  **P0:** Zero-trust scoping enforced at all server boundaries (orgId/residency/classification).
3.  **P0:** Server Components default with minimal client islands.
4.  **P1:** Typed boundaries with Zod + typed server actions (`useActionState`).
5.  **P1:** SOLID + DI with Open/Closed extension points and Liskov-safe interfaces.
6.  **P1:** Cache plan using `cacheLife` + `cacheTag` for org-scoped invalidation.
7.  **P2:** PPR shells + nested `Suspense` with layout-accurate skeletons.
8.  **P2:** Tailwind v4 tokens + CVA variants for consistent component theming.
9.  **P2:** Theming layer mapping brand tokens to surfaces/components.
10. **P3:** Motion tokens with CSS-first transitions and reduced-motion fallbacks.

*   [ ] Enforce zero-trust scoping (orgId/residency/classification) on every server boundary (started with org members pagination).
*   [ ] Default to Server Components; isolate `use client` islands behind stable boundary components.
*   [ ] Enforce strict TS (no `any`/`unknown`); publish stable types at module boundaries.
*   [ ] Validate all form and API inputs with Zod schemas at the boundary.
*   [ ] Type server actions with `useActionState` and explicit result unions.
*   [ ] Apply SRP/ISP/DIP; inject data and side-effect services via DI.
*   [ ] Provide Open/Closed extension points and Liskov-safe interfaces for module overrides.
*   [ ] Cache heavy reads at component boundaries; standardize `cacheLife` TTL and `cacheTag` invalidation by org.
*   [ ] Enable PPR for shells; use nested `Suspense` for widgets/filters with layout-accurate skeletons.
*   [ ] Centralize Tailwind v4 tokens and CVA variants for consistent component theming.
*   [ ] Build a theming layer that maps brand tokens to UI surfaces and components.
*   [ ] Define CSS motion tokens; apply CSS-first transitions with reduced-motion fallbacks.
