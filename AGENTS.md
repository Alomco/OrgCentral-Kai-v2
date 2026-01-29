# AGENTS.md

## Purpose
Provide project-specific rules for Codex to preserve coding conventions, security posture, and strict linting.

## Non-negotiables
- Keep files <= 250 LOC; split early and keep modules focused.
- Maintain the strict ESLint configuration; do not disable rules without explicit approval.
- Single source of truth: centralize shared logic, types, constants, and config.
- Strict TypeScript: avoid `any` and `unknown`; validate external input at boundaries.
- ISO27001-aligned coding: least privilege, secure defaults, auditability, and data minimization.

## Architecture and design
- SOLID + DI: favor SRP/ISP/DIP with clear interfaces and extensibility points.
- Liskov-safe interfaces; avoid narrowing that breaks substitutability.
- Open/Closed: extend via composition or injection instead of modifying core behavior.
- Zero-trust with tenant scoping: enforce `orgId`, residency, and classification rules.

## Next.js / UI rules
- Server Components first; keep "use client" islands minimal.
- Cache Components + `cacheLife` + `cacheTag` where appropriate.
- Use PPR + nested Suspense for streaming boundaries.
- Zod at boundaries (forms, API); Typed Server Actions (`useActionState`).
- Tailwind v4 tokens + class-variance-authority for variants.
- Tenant theme SSR via `x-org-id`.
- CSS-first motion with motion tokens and `prefers-reduced-motion` support.
- Optimize server state with React Query; use Zustand (persist/localStorage) for client-local storage.

## Tooling and verification
- Run lint in small parts using cache when working on large error sets.
- After completing work, run `npx tsc` and make it green, then run `pnpm lint --fix` and make it green.
- Check for side effects and ensure related actions, notifications, workers, and error handling are implemented.

## Security and quality
- Validate all external data; sanitize and normalize at boundaries.
- Use explicit allowlists for tenant-scoped queries.
- Log security-relevant events without leaking secrets.
- Keep changes minimal, reversible, and well-typed.

## API Routes (adapters)
- Route handlers must be thin and delegate to adapter controllers in src/server/api-adapters/**.
- Use export async function METHOD(request, { params }: { params: Promise<{ orgId: string }> }) and const { orgId } = await params for org routes.
- Always return NextResponse.json(result) from controllers; never call services or repositories directly in route files.
- Validate all inputs with Zod in controllers; enforce orgId and data-classification guards before data access.
- Prefer React Query for client mutations/queries; avoid outer.refresh() in client flows; invalidate typed query keys.
- Use Zustand only for client-local storage (persist/localStorage) via src/lib/stores/storage.ts.

## Interaction Decision Framework (HRM)
- Default: use useActionState for ~90% of forms; reserve React Query useMutation for highly interactive/optimistic UI.
- Choose useActionState when:
  - Form-heavy data entry; server validation + redirects/revalidate; auditing/tenancy checks (ISO27001 boundaries).
  - Examples: Hiring/Onboarding “Add Candidate”, Payroll/Compliance monthly submissions, Leave requests via standard form.
- Choose useMutation when:
  - Instant UI and optimistic updates; bulk actions; infinite lists or live polling.
  - Examples: Drag-and-drop candidate stage changes, real-time tax preview tweaks, “Check-in” button, infinite employee lists.
- Implementation notes:
  - Always validate at the boundary with Zod (adapters/actions), and enforce orgId/residency/classification guards.
  - For useMutation: compose typed keys; invalidate narrowly; use onMutate for optimistic UI and rollback on error.
  - For SSR -> CSR continuity: provide initialData to queries and keep filters in the URL; do not use outer.refresh() in client flows.
