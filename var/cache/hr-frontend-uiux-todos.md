# HR Frontend UI/UX — Top 10 TODOs + Implementation Checklist (Temp)

Purpose: Persist the prioritized HR-frontend TODOs and a concrete implementation checklist so context is not lost.
Scope: Frontend-first work under `src/app/(app)/hr/**` with minimal shared changes when needed.
Constraints: ≤250 LOC per file (split early), Server Components first, minimal `use client`, Cache Components + `cacheLife` + `cacheTag`, PPR + nested Suspense, strict TS (no `any`, no `unknown`), Zod at boundaries, typed server actions (`useActionState`), Tailwind v4 semantic tokens, CVA, tenant theme SSR (`x-org-id`), CSS-first motion + reduced-motion, SOLID/DI, OCP/LSP-safe interfaces, zero-trust tenant scoping.

---

## Priority Order (Top 10)

- [x] 1) Wrap HR in TenantThemeRegistry
- [x] 2) Add `cacheLife`/`cacheTag` to HR pages
- [x] 3) Add PPR + nested Suspense shells
- [x] 4) Convert remaining HR forms to `useActionState`
- [x] 5) Enforce Zod parsing at HR boundaries (HR app actions)
- [x] 6) Remove `unknown` helpers in HR schemas
- [x] 7) Add active route styling in `HrNavigation`
- [x] 8) Add a11y focus + `aria-live` feedback
- [x] 9) Add motion-reduce safeguards using motion tokens
- [x] 10) Standardize variants with CVA primitives

---

## Next 10 TODOs (11–20)

- [x] 11) Add skip-to-content link in HR layout
- [x] 12) Anchor HR main content id (skip-link target)
- [x] 13) Add `aria-label` landmark for HR navigation
- [x] 14) Add keyboard-visible focus styles to HR nav links
- [x] 15) Display org branding name in HR header when available
- [x] 16) Add global reduced-motion safeguard for `Badge` transitions
- [x] 17) Add `aria-busy` to HR forms during pending state
- [x] 18) Disable HR form controls while pending (`fieldset disabled`)
- [x] 19) Make status regions `aria-atomic="true"`
- [x] 20) Ensure HR navigation wraps on small screens

---

## Next 10 TODOs (21–30)

- [x] 21) Make skip-link target focusable (`tabIndex={-1}`)
- [x] 22) Add `title` attributes for header badges (org/role/email)
- [x] 23) Wire `Label htmlFor` → `SelectTrigger id` for onboarding template select
- [x] 24) Wire `Label htmlFor` → `SelectTrigger id` for checklist template type select
- [x] 25) Add `id` + `Label htmlFor` for checklist template edit fields
- [x] 26) Add `aria-describedby` for the Half day switch description
- [x] 27) Add `aria-describedby` for the Attach checklist template switch description
- [x] 28) Add `aria-describedby` for the Enable overtime switch description
- [x] 29) Ensure invitation token field has an accessible name
- [x] 30) Persist these TODOs in tracker markdown

---

## Next 10 TODOs (31–40)

- [x] 31) Ensure Radix switches disable while pending (fieldset-safe)
- [x] 32) Ensure Radix selects disable while pending (fieldset-safe)
- [x] 33) Add reduced-motion safeguard to `Switch` transitions
- [x] 34) Add reduced-motion safeguard to `SelectTrigger` transitions
- [x] 35) Add reduced-motion safeguard to `SelectContent` animations
- [x] 36) Combine pending state with existing select disable logic
- [x] 37) Keep hidden input switch patterns intact while disabling
- [x] 38) Keep server-first boundaries (no new client islands)
- [x] 39) Keep changes within 250 LOC per file
- [x] 40) Re-run lint after this tranche

---

## Next 10 TODOs (41–50)

- [x] 41) Add reduced-motion safeguard to `Spinner`
- [x] 42) Add inline spinners to HR submit buttons
- [x] 43) Add breadcrumbs for policy detail
- [x] 44) Add breadcrumbs for policy acknowledgments
- [x] 45) Permission-gate admin-only acknowledgments link
- [x] 46) Enforce admin permissions on acknowledgments page
- [x] 47) Avoid leaking admin UX to non-admins
- [x] 48) Keep breadcrumb styles using existing UI primitives
- [x] 49) Keep changes server-first (no new client islands)
- [x] 50) Re-run lint after this tranche

---

## Next 10 TODOs (51–60)

- [x] 51) Align HR nav onboarding visibility with permissions
- [x] 52) Enforce server-side permissions for `/hr/admin`
- [x] 53) Enforce server-side permissions for `/hr/employees`
- [x] 54) Enforce server-side permissions for `/hr/compliance` (OR check)
- [x] 55) Prevent direct URL access bypassing nav gating
- [x] 56) Gate onboarding panels by actual capabilities
- [x] 57) Redirect unauthorized users to access-denied
- [x] 58) Keep onboarding server-first (no new client code)
- [x] 59) Keep permission checks org-scoped (no cross-tenant leakage)
- [x] 60) Re-run lint after this tranche

---

## Next 10 TODOs (61–70)

- [x] 61) Add breadcrumbs to HR dashboard
- [x] 62) Add breadcrumbs to HR profile
- [x] 63) Add breadcrumbs to HR leave
- [x] 64) Add breadcrumbs to HR policies list
- [x] 65) Add breadcrumbs to HR onboarding
- [x] 66) Add breadcrumbs to HR settings
- [x] 67) Add breadcrumbs to HR placeholder routes via shared component
- [x] 68) Keep breadcrumbs using existing UI primitives only
- [x] 69) Keep changes server-first (no new client code)
- [x] 70) Re-run lint after this tranche

---

## Next 10 TODOs (71–80)

- [x] 71) Add breadcrumbs to HR onboarding loading state
- [x] 72) Add breadcrumbs to HR leave loading state
- [x] 73) Align HR settings loading with HrPageHeader
- [x] 74) Add breadcrumbs to HR onboarding error state
- [x] 75) Add breadcrumbs to HR leave error state
- [x] 76) Add breadcrumbs to HR settings error state
- [x] 77) Add `role="alert"` semantics for error summaries
- [x] 78) Keep error states minimal (no sensitive logging)
- [x] 79) Reuse existing breadcrumb UI primitives only
- [x] 80) Re-run lint after this tranche

---

## Next 10 TODOs (81–90)

- [x] 81) Ensure remaining placeholder pages enforce session
- [x] 82) Add explicit `auditSource` for `/hr/absences`
- [x] 83) Add explicit `auditSource` for `/hr/performance`
- [x] 84) Keep required permissions org-scoped (`organization:read`)
- [x] 85) Maintain server-first pages (no new client code)
- [x] 86) Keep placeholder breadcrumbs via shared component
- [x] 87) Prevent direct URL access without membership
- [x] 88) Avoid expanding UX beyond spec
- [x] 89) Keep file sizes small and consistent
- [x] 90) Re-run lint after this tranche

---

## Next 10 TODOs (91–100)

- [x] 91) Fix policy breadcrumbs to start at HR
- [x] 92) Fix policy acknowledgments breadcrumbs to include HR
- [x] 93) Mask user IDs in admin acknowledgments table UI
- [x] 94) Move HR dashboard permissions to page-level (avoid mid-page redirects)
- [x] 95) Add dashboard-level `auditSource`
- [x] 96) Tighten leave page required permissions to employee profile read
- [x] 97) Tighten leave submit server action permissions to employee profile read
- [x] 98) Keep changes server-first (no new client islands)
- [x] 99) Keep UX consistent with existing components
- [x] 100) Re-run lint after this tranche

---

## Next 10 TODOs (101–110)

- [x] 101) Make `/hr` landing role-aware (avoid access-denied loop)
- [x] 102) Redirect compliance-only users to `/hr/compliance`
- [x] 103) Keep member/admin users on `/hr/dashboard`
- [x] 104) Keep landing server-first (no client code)
- [x] 105) Add `auditSource` for HR landing
- [x] 106) Confirm HR actions use appropriate permission gates
- [x] 107) Confirm recent `select.tsx` edits are lint-safe
- [x] 108) Avoid adding new UI components or pages
- [x] 109) Keep tenant scoping via session context
- [x] 110) Re-run lint after this tranche

---

## Next 10 TODOs (111–120)

- [x] 111) Hide member HR nav items from compliance-only users
- [x] 112) Gate member nav items by `employeeProfile:read`
- [x] 113) Tighten HR profile page to require `employeeProfile:read`
- [x] 114) Tighten HR absences placeholder to require `employeeProfile:read`
- [x] 115) Tighten HR performance placeholder to require `employeeProfile:read`
- [x] 116) Prevent direct URL access to member surfaces by compliance role
- [x] 117) Keep compliance nav item unaffected
- [x] 118) Keep server-first enforcement (no new client code)
- [x] 119) Avoid expanding UX beyond existing components
- [x] 120) Re-run lint after this tranche

---

## Next 10 TODOs (121–130)

- [x] 121) Point HR nav brand link to `/hr` (role-aware)
- [x] 122) Point breadcrumb HR root link to `/hr` on member pages
- [x] 123) Point breadcrumb HR root link to `/hr` on admin pages
- [x] 124) Point breadcrumb HR root link to `/hr` on compliance pages
- [x] 125) Point breadcrumb HR root link to `/hr` on loading states
- [x] 126) Point breadcrumb HR root link to `/hr` on error states
- [x] 127) Keep breadcrumb UI primitives unchanged
- [x] 128) Avoid adding new routes/pages
- [x] 129) Keep links safe for mixed-role users
- [x] 130) Re-run lint after this tranche

---

## Next 10 TODOs (131–140)

- [x] 131) Add confirm dialog for onboarding invitation revoke
- [x] 132) Keep revoke action server-side (no API changes)
- [x] 133) Keep revoke UX minimal (no new pages)
- [x] 134) Add confirm dialog for checklist template delete
- [x] 135) Keep delete action server-side (no API changes)
- [x] 136) Keep delete UX minimal (no new pages)
- [x] 137) Use existing `AlertDialog` UI primitive only
- [x] 138) Preserve `useActionState` typed action wiring
- [x] 139) Preserve a11y semantics (`aria-busy`, focus-on-error)
- [x] 140) Re-run lint after this tranche

---

## Next 10 TODOs (141–150)

- [x] 141) Add typed `fieldErrors` to onboarding invite action/state
- [x] 142) Render inline field errors in onboarding invite form
- [x] 143) Improve Zod messages for onboarding invite fields
- [x] 144) Add typed `fieldErrors` to checklist template actions/state
- [x] 145) Render inline field errors in checklist template create/edit forms
- [x] 146) Fix duplicate input ids in checklist template edit (suffix by template id)
- [x] 147) Keep forms server-action driven (no react-hook-form)
- [x] 148) Keep a11y: `aria-invalid` + `aria-describedby`
- [x] 149) Avoid new design primitives (reuse tokens)
- [x] 150) Re-run lint after this tranche

---

## Next 10 TODOs (151–160)

- [x] 151) Add typed `fieldErrors` to leave request action/state
- [x] 152) Render inline field errors in leave request form
- [x] 153) Improve Zod messages for leave request fields
- [x] 154) Return date parse errors as field errors (leave)
- [x] 155) Add typed `fieldErrors` to HR settings action/state
- [x] 156) Render inline field errors in HR settings form
- [x] 157) Return CSV leave types validation as field error (settings)
- [x] 158) Return approval workflows JSON parse errors as field error (settings)
- [x] 159) Keep forms server-action driven + a11y wiring (`aria-invalid`, `aria-describedby`)
- [x] 160) Re-run lint after this tranche

---

## Implementation Checklist (File-Scoped)

### 1) Tenant theme SSR (High)
Target files:
- `src/app/(app)/hr/layout.tsx`
- Verify parent wrapper: `src/app/(app)/_components/app-layout-shell.tsx`

Steps:
- Confirm HR routes are nested under the (app) layout that renders `TenantThemeRegistry`.
- If any HR routes bypass that wrapper, wrap HR layout subtree with `TenantThemeRegistry` using org id from session context.
- Ensure any HR-only layout wrappers still use semantic tokens (`bg-background`, `text-foreground`) and do not hardcode colors.

Acceptance:
- Tenant palette is applied on first SSR paint for all `/hr/**` routes.
- No tenant theme flash / mismatch across HR pages.

Status:
- ✅ Completed (HR subtree wrapped via `TenantThemeRegistry`).

---

### 2) Cache Components (`cacheLife`/`cacheTag`) (High)
Target pages:
- `src/app/(app)/hr/dashboard/page.tsx`
- `src/app/(app)/hr/policies/page.tsx`
- `src/app/(app)/hr/policies/[policyId]/page.tsx`
- `src/app/(app)/hr/profile/page.tsx`

Steps:
- Define a consistent tag naming scheme per org and feature scope.
- Add `cacheLife(...)` + `cacheTag(...)` around read paths.
- Ensure corresponding write actions revalidate the right tags (acknowledge policy, submit leave, settings updates).

Acceptance:
- Reads are cached correctly per org; no cross-tenant leakage.
- Mutations refresh affected UI predictably.

Status:
- ✅ Completed for key HR read surfaces (policies + profile + dashboard summary).

---

### 3) PPR + nested Suspense (Medium/High)
Target pages:
- Same as #2 (especially dashboard/policies/profile).
Reference patterns:
- `src/app/(app)/hr/leave/page.tsx`
- `src/app/(app)/hr/onboarding/page.tsx`

Steps:
- Keep chrome static; stream panels with `<Suspense>`.
- Add skeletons that match final layout (table/card).

Acceptance:
- Faster TTFB feel; panels stream in without jarring layout shift.

Status:
- ✅ Completed on key HR pages (dashboard/policies/profile + acknowledgments list).

---

### 4) Convert remaining forms to `useActionState` (High)
Targets:
- `src/app/(app)/hr/onboarding/_components/checklist-templates-manager.tsx` (create/update/delete)
- `src/app/(app)/hr/policies/[policyId]/page.tsx` (acknowledge)
- `src/app/(app)/hr/onboarding/_components/onboarding-invitations-panel.tsx` (revoke)

Steps:
- Introduce typed state shape `{ status, message, fieldErrors?, values? }`.
- Add pending state UX; ensure consistent success/error rendering.

Acceptance:
- All HR mutations have consistent UI feedback and typed action state.

Status:
- ✅ Completed for policy acknowledge, onboarding invitation revoke, and checklist template CRUD.

---

### 5) Zod at boundaries (High)
Targets:
- HR form schemas: `src/app/(app)/hr/leave/schema.ts`, `src/app/(app)/hr/onboarding/schema.ts`
- HR actions invoked by those forms: `src/app/(app)/hr/**/actions.ts` (and server actions as needed)

Steps:
- Parse `FormData` with Zod immediately at action boundary.
- Return typed errors (field-level) rather than throwing.

Acceptance:
- No unvalidated input reaches domain/services; no `unknown` payload passing.

Status:
- ✅ Completed for HR app actions touched in this tranche (policies + onboarding templates/invitations).

---

### 6) Remove `unknown` helpers in schemas (Medium)
Targets:
- `src/app/(app)/hr/leave/schema.ts`
- `src/app/(app)/hr/onboarding/schema.ts`

Steps:
- Replace `unknown -> unknown` coercion helpers with `unknown -> boolean` (or Zod preprocess).

Acceptance:
- Strict TS maintained; schemas are self-describing and safe.

Status:
- ✅ Completed (helpers now return `boolean | undefined` and handle common FormData encodings).

---

### 7) Active route styling in navigation (Medium)
Target:
- `src/app/(app)/hr/_components/hr-navigation.tsx`

Steps:
- Prefer server-friendly approach if feasible; otherwise introduce a tiny client-only wrapper (minimal island).
- Use semantic tokens only.

Acceptance:
- Current section is obvious; nav remains accessible and responsive.

---

### 8) A11y focus + aria-live (Medium)
Targets:
- `src/app/(app)/hr/leave/_components/leave-request-form.tsx`
- `src/app/(app)/hr/onboarding/_components/invite-employee-form.tsx`
- `src/app/(app)/hr/settings/_components/hr-settings-form.tsx`

Steps:
- Add `aria-live="polite"` result region.
- Focus success/error on submit completion.

Acceptance:
- Screen readers announce updates; keyboard users keep context after submit.

---

### 9) Motion tokens + reduced-motion (Medium)
Targets:
- HR interactive surfaces (links/cards/nav) in `src/app/(app)/hr/**`
- Token source: `src/lib/animation/tokens.ts`

Steps:
- Use CSS-first transitions keyed to shared timing tokens.
- Respect reduced-motion via CSS media queries or existing hook.

Acceptance:
- Subtle motion polish without accessibility regressions.

Status:
- ✅ Completed for existing HR transitions (added `motion-reduce:transition-none` to nav + dashboard cards).

---

### 10) CVA standardization (Medium)
Targets:
- Status badge variant logic:
  - `src/app/(app)/hr/leave/_components/leave-requests-panel.tsx`
  - `src/app/(app)/hr/onboarding/_components/onboarding-invitations-panel.tsx`

Steps:
- Replace ad-hoc `switch -> variant` with CVA-based primitives.

Acceptance:
- Variant logic is centralized; consistent styling across HR modules.

Status:
- ✅ Completed (centralized status→variant mapping via a shared helper typed from `badgeVariants`).
