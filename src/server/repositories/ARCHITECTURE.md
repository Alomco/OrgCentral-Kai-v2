# Repository Layer Architecture - OrgCentral

The repository layer shields business services from database details, enforces zero-trust access, and guarantees that every multi-tenant query is scoped through RBAC and ABAC checks. This document is the canonical reference for implementing, reviewing, and linting repositories in `src/server/repositories`.

## Directory Layout
- `contracts/` - TypeScript interfaces that describe repository capabilities. These files **only** contain types and documentation comments. All imports must use `import type`.
- `mappers/` - Pure utility modules that translate between Prisma models and domain objects.
- `prisma/` - Concrete Prisma-backed repositories. Implement only data access and caching concerns.
- `helpers/` - Shared Prisma helpers such as delegate lookups, JSON conversion, transactions, and metadata extraction.
- `security/` - Repository-specific authorization helpers (`RepositoryAuthorizer`, `RepositoryAuthorizationContext`, etc.) that bridge `guards.ts` RBAC/ABAC logic into data access.
- `templates/` - Scaffolding utilities for new repositories.

Keep the folder hierarchy aligned with the product domain (`org`, `hr`, `records`, etc.). Every subdomain should follow the `contracts/mappers/prisma` triad to preserve modularity and discoverability.

## Goals And Non-Goals
- Enforce zero-trust: no repository call should execute without scoped tenant information. Authorization contexts flow from `guards.ts`.
- Guarantee RBAC + ABAC enforcement by requiring `RepositoryAuthorizationContext` at the contract boundary.
- Preserve strict typing: never leak `any`, prefer domain-specific types, and lean on discriminated unions for status fields.
- Maintain reusability: share helpers through `helpers/` or `security/` rather than duplicating logic inside repositories.
- Keep repositories free of service logic; do not implement workflows, orchestration, or policy evaluation outside the guard/helper stack.
- Keep Prisma usage inside repositories. Guards, services, ABAC evaluators, and loggers rely on repository contracts so the rest of the codebase never touches Prisma clients directly.
- Avoid direct Prisma client usage outside repositories. Services interact with contracts only.

## Zero-Trust Authorization Workflow
1. **Guard input** – Collect `orgId`, `userId`, and RBAC/ABAC requirements (`requiredPermissions`, `requiredAnyPermissions`, `action`, `resourceType`, `resourceAttributes`, residency/classification expectations).
2. **Authorize** – Use `withRepositoryAuthorization` (exported from `src/server/repositories/security`) to wrap the service operation. The guard itself queries membership and organization metadata through `IGuardMembershipRepository`, so even guard logic never touches Prisma directly:
   ```ts
   return withRepositoryAuthorization(
     {
       orgId,
       userId,
       requiredPermissions: { organization: ['update'] },
       action: 'update',
       resourceType: 'department',
       resourceAttributes: { departmentId },
     },
     async (context) => repository.updateDepartment(context, departmentId, payload),
   );
   ```
3. **Propagate context** – Pass the resulting `RepositoryAuthorizationContext` to repositories. This context bundles RBAC data, the ABAC subject, tenant scope (residency + classification), audit metadata, and correlation identifiers.
4. **Enforce in repositories** – Repositories must call `repositoryAuthorizer.assertTenantRecord` (or equivalent) before reading or mutating tenant data. Throw `RepositoryAuthorizationError` if the `orgId` mismatches.
5. **Audit + cache** – Use `context.auditSource`, `context.auditBatchId`, and `context.tenantScope` when writing metadata, registering cache tags, or emitting structured logs.

This workflow ensures that both RBAC and ABAC policies are honored before **any** SQL executes. The same guard also enforces residency and classification constraints, helping the platform remain compliant with zero-trust mandates.

## RBAC And ABAC Expectations
- RBAC role statements live in `src/server/security/access-control.ts`. Repositories never hardcode role names; they rely on the guard input prepared by services.
- ABAC policies are stored via `PrismaAbacPolicyRepository` and evaluated by `evaluateAbac`. Services must provide action/resource pairs when calling `withRepositoryAuthorization`.
- When filtering results (e.g., fetching all departments), apply additional attribute-level checks if the resource contains owner- or department-level metadata. When possible, delegate ABAC filtering to query predicates to avoid over-fetching.
- Always bubble up ABAC failures as `RepositoryAuthorizationError` or domain-specific errors that clearly indicate policy denial.

## RepositoryAuthorization Helpers
- `RepositoryAuthorizer` wraps `assertOrgAccessWithAbac`, merges default requirements, and returns `RepositoryAuthorizationContext`.
- `withRepositoryAuthorization(input, handler, authorizer?)` is the simplest entry point; use it in services.
- `RepositoryAuthorizationContext` extends the guard context and adds `tenantScope`, making cache helpers and metadata builders type-safe.
- `RepositoryAuthorizationError` provides a single error type for zero-trust violations; catch and translate it at the API layer if you need customer-friendly messaging.
- `TenantScopedRecord` and `hasOrgId` describe the minimal shape required for cross-tenant comparisons.

## Security And Infrastructure Repositories
- `IGuardMembershipRepository` (default `PrismaGuardMembershipRepository`) feeds `assertOrgAccess` with membership + organization metadata so guards can enforce zero-trust without importing Prisma clients.
- `IAbacPolicyRepository` (default `PrismaAbacPolicyRepository`) owns ABAC policy storage. `evaluateAbac` uses this contract exclusively.
- `IAuditLogRepository` backs `recordAuditEvent`, keeping the logging layer within the repository boundary.
- Shared helpers such as `buildMembershipMetadataJson`, `getModelDelegate`, and `runTransaction` live under `prisma/helpers`; reuse them instead of reimplementing metadata builders or delegate lookups.

### Example Repository Usage
```ts
import { RepositoryAuthorizer, type RepositoryAuthorizationContext } from '@/server/repositories/security';

const repositoryAuthorizer = RepositoryAuthorizer.default();

export class PrismaFooRepository extends BasePrismaRepository implements IFooRepository {
  async getFoo(context: RepositoryAuthorizationContext, fooId: string): Promise<Foo | null> {
    const record = await this.findById(fooId);
    if (!record) return null;
    repositoryAuthorizer.assertTenantRecord(record, context);
    return mapRecord(record);
  }
}
```

## Strict Typing And Linting
- Enable `strict` mode in `tsconfig` (already on). If you expand types, guard against `null` and `undefined`.
- Use `import type` in contracts to avoid bringing runtime code into declaration files.
- Prefer domain enums/unions to free-form strings. Example: `type SafeMembershipStatus = 'INVITED' | 'ACTIVE' | ...`.
- Never ignore the return type of Prisma calls; prefer explicit generics (`Prisma.ModelGetPayload`).
- Run `pnpm lint` before submitting PRs. The ESLint config enforces no `any`, consistent type imports, import sorting, and newline conventions. Fix warnings immediately—they usually indicate missing type coverage.
- When adding helpers, include focused unit tests under `src/server/repositories/**/__tests__` to prevent regressions in tenant scoping or mapper behavior.

## Reusability And Modularity Patterns
- **Base class** – All Prisma repositories extend `BasePrismaRepository`, taking a `PrismaClient` through dependency injection.
- **Org-scoped base class** - Repositories in `prisma/org` (or any module enforcing tenant checks) should extend `OrgScopedPrismaRepository`, which bundles the shared `RepositoryAuthorizer` along with cache tag helpers so implementations avoid duplicating boilerplate.
- **Helpers** – Use `getModelDelegate`, `runTransaction`, and `toPrismaInputJson` for shared concerns.
- **Mappers** – Keep transformation logic isolated; repositories should not convert raw Prisma objects manually.
- **Domain utilities** – Business calculations (e.g., converting hours to days for leave) belong in `src/server/domain/**` helpers such as `leave-calculator.ts` and `hours-per-day-resolver.ts`. Pass configuration (like org-specific hoursPerDay) down to mappers rather than hardcoding assumptions in mapping code.
- **Security utilities** – Reuse the global `RepositoryAuthorizer` singleton rather than re-implementing org ID comparisons in each file.
- **Guard state** – `guards.ts` exposes test-only setters (`__setGuardMembershipRepositoryForTests`, `__resetGuardMembershipRepositoryForTests`) to swap the membership repository without leaking mutable globals into production. Avoid using mutable singletons in runtime code; prefer passing dependencies through authorization inputs or repository constructors.
- **Cache helpers** – Always call `registerOrgCacheTag` on read methods and `invalidateOrgCache` on mutating methods if the data is cached downstream.
- **Error strategy** – Throw `RepositoryAuthorizationError` for policy violations, `NotFoundError` (or plain `Error`) for missing data, and let services map those to API responses.

## Guidance For Files That Exceed 250 LOC
- The repository layer should stay readable. If a file approaches 250 lines:
  - Extract helper functions into adjacent modules (e.g., `prisma-foo-repository.transformers.ts`).
  - Move mapper logic into `mappers/`.
  - Convert repeated validation into reusable utilities under `helpers/` or `security/`.
  - Break contracts into smaller interfaces if a domain has multiple aggregates.
- When a file legitimately needs more than 250 LOC (e.g., complicated ABAC-aware repositories), document the rationale in a header comment and add anchors in this guide.

## Coding Checklist For New Repositories
1. **Define contract**
   - Place it under `contracts/<domain>/<feature>`.
   - Accept `RepositoryAuthorizationContext` for every method that reads or mutates tenant data.
   - Document RBAC/ABAC expectations inline.
2. **Add mapper**
   - Map both directions.
   - Cover the mapper with unit tests.
3. **Implement Prisma repository**
   - Extend `BasePrismaRepository`.
   - Inject `RepositoryAuthorizer` (use the singleton unless you need custom defaults).
   - Validate org ownership with `assertTenantRecord`.
   - Register/invalidate cache tags.
4. **Wire up exports**
   - Update `index.ts` barrels for `contracts`, `mappers`, and `prisma`.
5. **Document**
   - Update this architecture file if you introduce a new pattern.
   - Add README notes under `src/server/repositories/<domain>` if the feature has domain-specific caveats.
6. **Test + lint**
   - Mock Prisma client or use an in-memory approach to exercise repository logic.
   - Run `pnpm lint` and ensure no warnings remain.

## Multi-Tenant Data Handling
- Always scope Prisma queries with `context.orgId` or a `TenantScope` derived from it.
- When duplicating records (e.g., copying templates between orgs), perform the copy in two steps: read with one context, write with a newly authorized context.
- Store residency/classification fields alongside records using `context.tenantScope` to enforce compliance downstream.
- Use structured audit fields: `context.auditSource`, `context.auditBatchId`, and `context.correlationId`.

## Cache And Invalidation Strategy
- Register cache tags for the org before reads (`registerOrgCacheTag(context.orgId, '<bucket>', context.dataClassification, context.dataResidency)`).
- Invalidate relevant tags immediately after mutations to preserve cache coherency.
- Use `context.tenantScope` to decide whether to fan-out invalidations across residency zones if a feature requires it.

## Example End-To-End Flow
```ts
// service layer
export async function updateDepartment(args: UpdateDepartmentInput) {
  return withRepositoryAuthorization(
    {
      orgId: args.orgId,
      userId: args.userId,
      requiredPermissions: { organization: ['update'] },
      action: 'update',
      resourceType: 'department',
      resourceAttributes: { departmentId: args.departmentId },
      expectedResidency: args.expectedResidency,
      expectedClassification: args.expectedClassification,
    },
    async (context) => {
      await departmentRepository.updateDepartment(context, args.departmentId, args.payload);
      return departmentRepository.getDepartment(context, args.departmentId);
    },
  );
}
```

This pattern highlights the zero-trust requirements: the guard approves the action, provides residency/classification context, and the repository enforces tenant boundaries.

## References
- `src/server/security/guards.ts` – RBAC/ABAC guard implementation.
- `src/server/security/access-control.ts` – RBAC roles and statements.
- `src/server/repositories/security/repository-authorization.ts` – Helper utilities introduced in this guide.
- `src/server/repositories/README.md` – High-level overview and quick-start.

Keep this document updated whenever the repository layer evolves so engineers and auditors can trace how RBAC, ABAC, strict typing, linting, reusability, modularity, and zero-trust principles are enforced across OrgCentral.
