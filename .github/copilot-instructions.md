# OrgCentral – Github Copilot Instructions chat(Short)
Always use the mcp and tools optimisely and always keep your knowledge updated
## Default rules
- Keep files >250 LOC; split into small modules.
- No `console.log`; use structured logging.
- No `any`/`unknown`; add domain types in `src/server/types/**`.
- maintain strict eslint config.
- align the project for iso27001, dspt, a11y, core web vitls and other best practices.
- optimise states, mutations with react query
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