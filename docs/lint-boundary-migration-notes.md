# Lint Boundary Migration Notes

Use this checklist to keep boundary/no-restricted-imports fixes consistent across chats.

## Goals
- Maintain ISO 27001-aligned practices: no secret/PII leakage, preserve multi-tenant metadata (orgId, residency, classification), and keep cache invalidation safe.
- Enforce single source of truth (SSOT): shared providers/factories own Prisma wiring; consumers rely on contracts/providers only.
- Keep files ≤ 250 LOC; split helpers before exceeding.
- Never modify lint/ESLint config; fix code instead.
- Enforce strict type safety: avoid `any/unknown`, prefer `import type`, and honor existing domain types.
- Remove direct `@/server/lib/prisma` and `@/server/repositories/prisma/**` imports from disallowed layers (services, api-adapters, use-cases).
- Route Prisma wiring through repository/provider factories under `src/server/repositories/providers/**` (or equivalent composition modules) that are allowed to import Prisma.
- Consumers (services, use-cases, api-adapters) depend on contracts or provider helpers only.

## Standard Pattern
1. **Create provider/factory (repositories layer):**
   - Location: `src/server/repositories/providers/<domain>/<name>-dependencies.ts` (or similar).
   - Expose a builder like `build<Name>Dependencies(options?: { prismaOptions?; overrides? })` that returns the dependency shape for the service/use-case.
   - Accept `prismaOptions` (prisma, trace, onAfterWrite) and optional overrides.
2. **Update service provider:**
   - Replace direct Prisma imports with the builder function.
   - Keep service-level extras (e.g., cache invalidation hooks, billing/notification wiring, generators) in the provider.
   - Return shared singleton when no overrides/options are passed.
3. **Update API adapters/use-cases:**
   - Stop instantiating Prisma repositories directly.
   - Use the service provider/composition helper (e.g., `get<Name>Service()`, or a `resolve<Name>Dependencies` that wraps the service).
4. **Keep boundaries:**
   - `api-adapters` can call `services` and `use-cases`, not Prisma.
   - `services` can call `repositories/contracts/prismaRepositories` via providers but should avoid direct Prisma imports after refactor.
   - Repository providers live in repositories layer, which is allowed to import Prisma.
5. **Small lint fixes:**
   - Remove unused imports; prefer `??=`; avoid default object stringification.

## Naming Tips
- File: `membership-service-dependencies.ts`, `absence-service-dependencies.ts`, etc.
- Function: `build<Domain>Dependencies`, `create<Repo>Repository`.
- Options: `{ prismaOptions?, overrides? }` to keep caller customization.

## Validation Steps
- After edits, run `pnpm lint` (or scope if large).
- Ensure no `no-restricted-imports`/`boundaries` remain for the touched files.

## Current status snapshot (manual update as work progresses)
- Absence service/provider and HR absences API adapter: ✅ moved to provider.
- Membership service/provider: ✅ uses provider builder.
- Invitation flow use-case: ✅ uses provider builder.
- Remaining hotspots: platform notifications providers, security/roles/permissions providers, HR leave/compliance/onboarding providers, seeder scripts.
