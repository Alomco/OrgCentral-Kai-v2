# OrgCentral â€“ Github Copilot Instructions chat(Short)
Always use MCP/tools thoughtfully. Keep knowledge updated with .agent and .github folders.
## Default rules
- Keep files <=250 LOC; split into focused modules.
- No `console.log`; use structured logging.
- No `any`/`unknown`; add domain types in `src/server/types/**`.
- maintain strict eslint config.
- align the project for iso27001, dspt, a11y, core web vitls and other best practices.
- Prefer React Query for server state (queries/mutations) + cache invalidation; use Zustand with persist for client-local state (theme, UI prefs).
## Multi-tenancy + compliance
- Every feature must preserve tenant metadata: `orgId`, `dataResidency`, `dataClassification`, and audit fields.
- Always enforce access via guards (`assertOrgAccess` / `withOrgContext`) before data access.
- Never leak secrets/PII in logs, errors, or test snapshots.

## Repositories (SOLID)
- Contracts: `src/server/repositories/contracts/**` (use `import type`).
- Mappers: `src/server/repositories/mappers/**`.
- Implementations: `src/server/repositories/prisma/**` (DI via constructors; extend base repos).
- Services depend on contracts, not concrete implementations.

## Caching (centralized, safe)
- Caching policy lives in **use-cases**; repositories do not own caching.
- Use the central API: `src/server/lib/cache-tags.ts` (do not import `next/cache` in app code).
- Sensitive data must **never be cached**:
   - If `dataClassification !== 'OFFICIAL'`, treat reads as **no-store**.

## Next.js patterns
- Prefer Server Components; keep client components in `src/components/**`.
- Server actions belong in route-local `actions.ts` and must invalidate the specific cache scopes they mutate.

## Workflow
- After changes: check errors, run `npx tsc --noEmit`, then `pnpm lint` (scope to changed paths when practical).

after every chat response, suggest next step or optimization.

## React Query Patterns
- Queries live in small *api* modules with typed keys (e.g. \\
oleKeys.list(orgId)\\).
- Mutations: call API routes; onSuccess invalidateQueries the affected keys; avoid 
outer.refresh(). 
- Use initialData for SSR -> CSR continuity; handle errors via mutation error and toasts.
- Validate all inputs with Zod in API controllers; never trust client data.

## Zustand Usage
- Only for UI/local storage: use persist with custom storage from src/lib/stores/storage.ts to support SSR.
- Do not store server data (use React Query instead).


## API Routes (adapters)
- Handlers are thin adapters only; delegate to controllers in src/server/api-adapters/**.
- For org routes use params: Promise<{ orgId: string }> and const { orgId } = await params.
- Return NextResponse.json(result); no direct service calls in routes.
- Validate with Zod at the adapter boundary; never trust client data.
- Client flows: React Query mutations + invalidateQueries; do not use 
outer.refresh().

## Decision Framework (forms vs mutations)
- Prefer useActionState for standard forms that do server validation, revalidate/redirect, and require audit/tenancy checks.
- Use useMutation only for interactive widgets that need optimistic updates (D&D, toggles, inline deletes) or list invalidation.
- Keep filters in the URL; compose query keys from filter params; avoid 
outer.refresh().
## HR Policies Search + URL Sync
- Server-side search: /api/hr/policies accepts `?q=` and optional `nocat=1` to disable auto category mapping.
- Auto-map common q values to categories (benefits, conduct/ethics, security, health/safety, procedures, compliance). Keep client UI chip “Category: …” and a Clear button that sets `nocat=1` while preserving q.
- Client query: compose `policyKeys.list(q,nocat)` and fetch `/api/hr/policies?q=…&nocat=…`.

## Local UI State (Zustand)
- Persist UI-only prefs (e.g., default `nocat` behavior) under `src/app/(app)/hr/policies/_components/policies-ui.store.ts` using the safe storage helpers. Never store server data.

## No router.refresh in clients
- Replace with React Query invalidations on the precise keys (e.g., permissions, members, audit, policies). Forms continue to use `useActionState` and call `invalidateQueries` on success.
