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
- optimise states with react query.

## Tooling and verification
- Run lint in small parts using cache when working on large error sets.
- After completing work, run `npx tsc` and make it green, then run `pnpm lint --fix` and make it green.
- Check for side effects and ensure related actions, notifications, workers, and error handling are implemented.

## Security and quality
- Validate all external data; sanitize and normalize at boundaries.
- Use explicit allowlists for tenant-scoped queries.
- Log security-relevant events without leaking secrets.
- Keep changes minimal, reversible, and well-typed.
