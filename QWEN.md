# OrgCentral Development Guide

This document serves as the central reference for development practices, architecture patterns, and lint boundary compliance in the OrgCentral project.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Lint Boundary Rules](#lint-boundary-rules)
- [Prisma Access Patterns](#prisma-access-patterns)
- [Provider Factory Pattern](#provider-factory-pattern)
- [Migration Checklist](#migration-checklist)
- [Naming Conventions](#naming-conventions)
- [Validation Steps](#validation-steps)
- [Current Status](#current-status)

## Architecture Overview

OrgCentral follows a layered architecture with strict boundaries between different concerns:

- **API Routes** (`src/app/api/**`): Entry points for HTTP requests
- **API Adapters** (`src/server/api-adapters/**`): Adapt external requests to internal use cases
- **Use Cases** (`src/server/use-cases/**`): Business logic orchestration
- **Services** (`src/server/services/**`): Domain-specific business operations
- **Repositories** (`src/server/repositories/**`): Data access abstraction
- **Prisma Repositories** (`src/server/repositories/prisma/**`): Direct Prisma operations
- **Contracts** (`src/server/repositories/contracts/**`): Repository interfaces
- **Lib** (`src/server/lib/**`): Shared utilities and infrastructure
- **Types** (`src/server/types/**`): Type definitions and DTOs
- **Workers** (`src/server/workers/**`): Background job processing

## Lint Boundary Rules

Our ESLint configuration enforces strict import boundaries to maintain architectural integrity:

### API Routes (`src/app/api/**`)
- May import from: `apiRoutes`, `apiAdapters`, `useCases`, `services`, `lib`, `types`

### Workers (`src/server/workers/**`)
- May import from: `workers`, `useCases`, `services`, `repositories`, `lib`, `types`, `contracts`

### API Adapters (`src/server/api-adapters/**`)
- May import from: `apiAdapters`, `useCases`, `services`, `lib`, `types`, `workers`

### Use Cases (`src/server/use-cases/**`)
- May import from: `useCases`, `services`, `repositories`, `contracts`, `lib`, `types`

### Services (`src/server/services/**`)
- May import from: `services`, `useCases`, `repositories`, `contracts`, `lib`, `types`, `workers`

### Repositories (`src/server/repositories/**`)
- May import from: `repositories`, `prismaRepositories`, `contracts`, `lib`, `types`

### Prisma Repositories (`src/server/repositories/prisma/**`)
- May import from: `prismaRepositories`, `repositories`, `contracts`, `types`, `lib`

### Contracts (`src/server/repositories/contracts/**`)
- May import from: `contracts`, `types`, `repositories`, `prismaRepositories`

### Lib (`src/server/lib/**`)
- May import from: `lib`, `types`, `workers`

### Types (`src/server/types/**`)
- May import from: `types`

## Prisma Access Patterns

Direct imports of Prisma are restricted in certain layers to maintain clean architecture:

### Restricted Import Patterns
- `@/server/lib/prisma` - Forbidden in: API routes, workers, API adapters, services, use cases
- `@/server/repositories/prisma/**` - Forbidden in: API routes, workers, API adapters, services, use cases

### Allowed Prisma Access Points
- Prisma repositories (`src/server/repositories/prisma/**`) - Direct Prisma access allowed
- Repository providers/factories - Direct Prisma access allowed

## Provider Factory Pattern

To comply with lint boundaries while maintaining flexibility, use the provider factory pattern:

### 1. Create Provider/Factory (repositories layer)
Location: `src/server/repositories/providers/<domain>/<name>-dependencies.ts` (or similar)

```typescript
// Example: membership-service-dependencies.ts
import { PrismaClient } from '@prisma/client';
import { IMembershipRepository } from '@/server/repositories/contracts';
import { PrismaMembershipRepository } from '@/server/repositories/prisma';

export interface PrismaOptions {
  prisma?: PrismaClient;
  trace?: (spanName: string, fn: () => Promise<any>) => Promise<any>;
  onAfterWrite?: () => void;
}

export interface Overrides {
  membershipRepository?: IMembershipRepository;
  // other dependencies that can be overridden for testing/mocking
}

export interface MembershipDependencies {
  membershipRepository: IMembershipRepository;
  // other dependencies needed by the service
}

export function buildMembershipDependencies(
  options?: { 
    prismaOptions?: PrismaOptions; 
    overrides?: Overrides 
  }
): MembershipDependencies {
  const { prismaOptions, overrides } = options || {};
  
  const membershipRepository = overrides?.membershipRepository 
    ? overrides.membershipRepository
    : new PrismaMembershipRepository(prismaOptions?.prisma);
    
  return {
    membershipRepository,
    // other dependencies
  };
}
```

### 2. Update Service Provider
Replace direct Prisma imports with the builder function. Keep service-level extras (e.g., cache invalidation hooks, billing/notification wiring, generators) in the provider. Return shared singleton when no overrides/options are passed.

```typescript
// Example: membership-service-provider.ts
import { buildMembershipDependencies } from './providers/membership/membership-dependencies';
import { MembershipService } from './membership-service';

let singleton: MembershipService | null = null;

export function getMembershipService(options?: { 
  prismaOptions?: PrismaOptions; 
  overrides?: Overrides 
}) {
  // Return singleton if no custom options provided
  if (!options && singleton) {
    return singleton;
  }
  
  const dependencies = buildMembershipDependencies(options);
  const service = new MembershipService(dependencies);
  
  // Cache singleton only when no custom options
  if (!options) {
    singleton = service;
  }
  
  return service;
}
```

### 3. Update API Adapters/Use-Cases
Stop instantiating Prisma repositories directly. Use the service provider/composition helper (e.g., `get<Name>Service()`, or a `resolve<Name>Dependencies` that wraps the service).

```typescript
// Example: membership-api-adapter.ts
import { getMembershipService } from '@/server/services/membership/membership-service-provider';

export async function createMembership(request: CreateMembershipRequest) {
  const service = getMembershipService();
  return await service.createMembership(request);
}
```

## Migration Checklist

Use this checklist to ensure consistent boundary compliance:

- [ ] **Maintain ISO 27001-aligned practices**: No secret/PII leakage, preserve multi-tenant metadata (orgId, residency, classification), and keep cache invalidation safe
- [ ] **Enforce single source of truth (SSOT)**: Shared providers/factories own Prisma wiring; consumers rely on contracts/providers only
- [ ] **Keep files ≤ 250 LOC**: Split helpers before exceeding
- [ ] **Never modify lint/ESLint config**: Fix code instead
- [ ] **Enforce strict type safety**: Avoid `any/unknown`, prefer `import type`, and honor existing domain types
- [ ] **Remove direct `@/server/lib/prisma` and `@/server/repositories/prisma/**` imports** from disallowed layers (services, api-adapters, use-cases)
- [ ] **Route Prisma wiring through repository/provider factories** under `src/server/repositories/providers/**` (or equivalent composition modules) that are allowed to import Prisma
- [ ] **Consumers (services, use-cases, api-adapters) depend on contracts or provider helpers only**

## Naming Conventions

### Files
- Provider factories: `<domain>-service-dependencies.ts`, `<feature>-repository-dependencies.ts`
- Service providers: `<domain>-service-provider.ts`, `<feature>-service-provider.ts`

### Functions
- Builder functions: `build<Domain>Dependencies`, `create<Repo>Repository`
- Service getters: `get<Domain>Service`, `resolve<Domain>Dependencies`

### Options
- Configuration objects: `{ prismaOptions?, overrides? }` to keep caller customization

## Validation Steps

After implementing boundary changes:

1. Run `pnpm lint` (or scoped lint if working on a large codebase)
2. Ensure no `no-restricted-imports`/`boundaries` errors remain for the touched files
3. Verify that all Prisma access is properly routed through the provider factory pattern
4. Confirm that tests still pass with the new dependency injection pattern

## Current Status

Based on the lint boundary migration notes, here's the current status:

- ✅ **Absence service/provider and HR absences API adapter**: Moved to provider
- ✅ **Membership service/provider**: Uses provider builder  
- ✅ **Invitation flow use-case**: Uses provider builder
- 🔄 **Remaining hotspots**: platform notifications providers, security/roles/permissions providers, HR leave/compliance/onboarding providers, seeder scripts

## Best Practices

### Small Lint Fixes
- Remove unused imports
- Prefer `??=` for conditional assignments
- Avoid default object stringification
- Use `import type` for contracts and DTOs
- Keep runtime imports minimal
- Use `node:` specifiers for built-ins (`node:crypto`, `node:path`)

### Type Safety
- Avoid `any`; use domain unions/enums or `unknown` with narrowing
- Keep functions total where possible
- Handle promises with `await` (no floating promises)
- Avoid implicit `void` returns unless intended

### Module Size
- Keep modules under ~250 LOC
- Extract helpers (ops, mappers, cache) into adjacent files before crossing the limit
- Sort imports logically, no cycles (`import/no-cycle`)
- Avoid self-imports; use explicit paths

### Logging
- No `console`; use structured logger/telemetry helpers
- Follow the structured logging setup guidelines in `docs/structured-logging-setup.md`

## References

- [Lint Boundary Migration Notes](./docs/lint-boundary-migration-notes.md)
- [Lint Safe Patterns](./docs/lint-safe-patterns.md)
- [ISO 27001 Compliance Audit](./docs/iso-27001-compliance-audit.md)
- [Structured Logging Setup](./docs/structured-logging-setup.md)