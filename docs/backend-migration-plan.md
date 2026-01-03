# OrgCentral Backend Migration Playbook

Purpose: lift the mature Firebase + Cloud Functions backend that lives in `old/` into the fresh `orgcentral/` workspace while honoring the new Prisma + PostgreSQL + Mongo stack, Better Auth identity, BullMQ workers, and the strict SOLID guidance documented in `docs/qwen_cp_mix` and `old/docs/requirements`. Every numbered task below is small enough (<250 LOC per file) to hand off to a CLI or agent.

## Guiding Pillars
- **SOLID service mesh** – every domain module exposes interfaces in `src/server/contracts/**`, concrete services in `src/server/services/**`, repositories in `src/server/repositories/**`, and schema adapters in `src/server/mappers/**`. Favor constructor injection over global imports.
- **Interface locking + abstract bases** – define abstract base classes (e.g., `AbstractOrgService implements OrgServiceContract`) that bake in tenant guards, audit emitters, and cache tags. Concrete classes live beside their Prisma/Mongo repositories.
- **Small-file discipline** – split handlers/actions so no file exceeds ~250 LOC. Compose behavior through factories rather than enlarging monoliths.
- **Next.js 16 tooling** – implement business APIs as Route Handlers + Server Actions with Cache Components (`use cache`, `cacheLife`, `cacheTag`) for deterministic invalidation. Keep Next DevTools + MCP runtime on during development.
- **Strict lint + testing** – extend the existing `eslint.config.mjs` to cover new server directories, enforce `@typescript-eslint/strict-type-checked`, SonarJS, and Unicorn rules. Each task finishes with targeted Vitest suites.
- **Gov-secure posture** – embed zero-trust, residency, and audit requirements from `old/docs/requirements/02-security-and-compliance.md` & `04-delivery-guardrails.md`. All Prisma writes include `orgId`, region, classification fields; Mongo collections carry `schemaVersion` + CSFLE metadata.

---

## Phase 0 – Inventory & Compliance Alignment
1. **Manifest the Firebase backend**
   - Export a CSV/JSON manifest covering `old/firebase/functions/src/functions/*.ts`, `lib/*.ts`, and `types.ts` with responsibilities, Firestore paths, and triggers.
   - Tag each function with `tenant-aware?`, `needs Mongo?`, `async queue?`, and `gov controls?` metadata for later mapping.
2. **Map regulatory constraints**
   - From `requirements/02-security-and-compliance.md`, derive a checklist per domain (MFA dependencies, audit logs, residency tags, SAR export impacts).
   - Store the checklist in `docs/requirements/backend-migration-controls.md` for traceability.
3. **Set up diagnostics**
   - Enable Next MCP runtime (`pnpm dev -- --experimental-devtools`) and document available runtime tools for observability gating.
   - Wire OTEL + structured logging base class to ensure every new service emits tenant + correlation IDs.

## Phase 1 – Data Model & Persistence Foundation
1. **Prisma module extensions**
   - Compare `old/firebase/functions/src/types.ts` with `prisma/modules/*.prisma`.
   - Create new module files (`prisma/modules/orgadmin.prisma`, `.../workflow.prisma`, etc.) for any missing models (custom roles, checklists, absence records).
   - Run `pnpm db:compose` + `pnpm db:migrate` after each addition; attach ADR notes.
2. **Mongo adjunct schemas**
   - Mirror document-heavy collections (`documents`, `events`, `aiSessions`, `auditLogs`) into `prisma/mongo.schema.prisma` with `schemaVersion`, `dataClassification`, `retentionPolicyId`.
   - Define JSON Schema validators in `docs/mongo-schemas/**` to keep Cloud Functions parity.
3. **Repository layer**
   - For each Prisma module, create repository interfaces in `src/server/repositories/contracts`. Example: `LeaveRequestRepositoryContract` with CRUD + search signatures.
   - Provide Postgres implementations (Prisma) and, where needed, Mongo implementations; include caching decorators that expose `cacheTag(["org", orgId, "leave"] )`.

## Phase 2 – Shared Infrastructure Services
1. **Queue + cron orchestration**
   - Translate Firebase scheduled jobs to BullMQ queues defined under `src/server/queues`. Abstract queue interactions via `AbstractQueueWorker`.
   - Provide workers for leave accrual recomputations, compliance audits, onboarding checklists.
2. **Notification + email adapters**
   - Rewrite `old/firebase/functions/src/lib/notifications.ts` as `NotificationService` implementing `NotificationPort`. Use Resend + Novu providers selectable via DI.
   - All notifications log to `AuditLog` + Mongo `auditLogs` (dual write) following zero-trust guidance.
3. **Guards + policy enforcement**
   - Port guard helpers (`guards.ts`) into `src/server/security/guards.ts`. Wrap DB-driven permission resolution plus Better Auth context resolvers.
   - Build `PolicyEvaluationService` that ensures RBAC + ABAC checks run before repository calls.

## Phase 3 – Identity, Membership, and Org Lifecycle
1. **Better Auth sync**
   - Implement `BetterAuthAdapter` (class) to mirror Firebase auth triggers: user creation, MFA enrollment, session rotation.
   - Provide server action endpoints for invite acceptance and membership activation.
2. **Membership services**
   - Create `MembershipService` with interface `IMembershipService` covering: invite generation, role assignment, org switching, member archival.
   - Incorporate abstract base for `TenantScopedService` to centralize `orgId` validation + audit logging.
3. **Org provisioning**
   - Port `createOrganization`, `updateOrgSettings`, custom role CRUD from `org-admin.ts` into dedicated services:
     - `OrganizationService` (manages metadata, leave defaults).
     - `CustomRoleService` (manages Role records with permissions JSON, inheritance, and registry constraints; integrates permission resolver + cache invalidation).
   - Publish events to BullMQ outbox for cross-domain updates (branding, notifications, entitlements).

## Phase 4 – HR Domain (Leave, Absences, Onboarding, People)
1. **Leave management**
   - Break `hr-leave.ts` into:
     - `LeaveCalculator` (pure functions for balances, rounding, year boundaries).
     - `LeaveRequestService` (submit/approve/reject/cancel) implementing `ILeaveRequestService`.
     - `LeaveBalanceService` (entitlement sync, accrual jobs) using abstract base to enforce tenant/residency.
   - Replace Firestore transactions with Prisma interactive transactions; ensure dual-write to Mongo events for audit.
2. **Absence + compliance**
   - From `hr-absences.ts` and `hr-compliance.ts`, create `AbsenceIncidentService`, `ComplianceCheckService` with plugin interfaces for AI validation + regulatory checks (Working Time Regulations, Equality Act, etc.).
   - Persist attachments via `DocumentVault` + `storage.ts` adapter; store `classification`, `retentionPolicyId`.
3. **Onboarding workflows**
   - Translate `hr-onboarding.ts` checklists to `OnboardingChecklistService` backed by Prisma `ChecklistTemplate` + `ChecklistInstance` tables.
   - Use BullMQ to schedule due-date reminders; expose Server Actions for HR to manage steps.
4. **People directory (profiles + contracts)**
   - Map `old/src/lib/hr/types.ts` and `old/src/lib/hr/firestore.ts` employees/services into Prisma HR people models, repositories, and services; keep legacy fields in `metadata` until promoted.
   - Align HR people APIs with cache + residency/classification helpers already noted in `src/server/use-cases/hr/people/README.md` (treat README TODOs as the live gap list).
   - Ensure HR people flows (profiles, contracts, compliance log, documents) fan out audit writes and register cache tags per residency/classification scope.

## Phase 5 – Enterprise & Platform Modules
1. **Branding + enterprise controls**
   - Rebuild `branding-admin.ts` as `BrandingService` storing theme metadata in `Organization.settings.branding` JSONB.
   - Implement caching with `cacheLife({ mode: "public", maxAge: 3600 })` for CDN-friendly assets, invalidated via cache tags.
2. **Workflow automation**
   - Move `workflow-admin.ts` logic into `WorkflowTemplateService` + `WorkflowRunService`, enabling interface-based adapters for future providers (e.g., Temporal, Durable Functions).
3. **Enterprise + platform admin**
   - `enterprise-admin.ts` functionalities (multi-org oversight, cross-tenant reports) should become dedicated repositories with restricted RBAC/ABAC policies.
   - Platform admin APIs become Next Route Handlers under `src/app/api/platform-admin/**` using streaming JSON responses.

## Phase 6 – Notifications & AI Assistants
1. **Notification center**
   - Port `notifications-test.ts` and any message creation logic into `NotificationComposerService`. Wrap Novu + Resend senders.
   - Provide Server Actions for preview/send/test, hooking into Cache Components to refresh inbox UI.
2. **AI + Genkit replacements**
   - Replace Firebase Genkit triggers with Next server modules under `src/server/ai`. Use new `genkit.ts` wrappers already present in `src/ai/*`.
   - Ensure AI transcripts persist into Mongo `aiSessions` with CSFLE and auditing.

## Phase 7 – API Surface & Server Actions
1. **Route handlers per domain**
   - For each service, create a thin Next Route Handler (REST) plus Server Actions for UI flows. Example: `app/api/orgs/[orgId]/roles/route.ts` calling `CustomRoleService`.
   - Enforce `TenantScopedService` injection so handlers remain <80 LOC.
2. **tRPC/JSON-RPC layer**
   - Define a typed RPC router in `src/server/rpc` that binds services to machine users (CLI/agents). Document endpoints for automation.
3. **Cache + invalidation strategy**
   - Standardize cache tags per entity: `cacheTag(["org", orgId, "members"])` etc. Document them in this file for consistency.

## Phase 8 – Verification, Tooling, and Compliance Sign-off
1. **Testing matrix**
   - For every service, add Vitest suites under `src/server/services/__tests__/**` covering success/failure paths, tenant leakage, and role enforcement.
   - Provide integration tests hitting Prisma test DB + Mongo memory server.
2. **Static + lint gates**
   - Extend `eslint.config.mjs` to include new directories, enable `eslint-plugin-security`, ensure `pnpm lint --max-warnings=0` is part of the automation script.
   - Run `pnpm test`, `pnpm lint`, `pnpm depcheck`, `pnpm knip` before merging backend work.
3. **Observability + ADRs**
   - Each completed domain publishes OTEL dashboards + runbooks (documented in `/docs/runbooks/<domain>.md`).
   - File ADRs summarizing migration decisions, data model changes, and compliance sign-offs.

---

## Execution Tips for Multi-Agent Work
- Treat each numbered task above as an assignable ticket. Provide agents with:
  - Source file(s) in `old/firebase/functions/src`.
  - Target directories in `orgcentral/src/server/**` and `app/api/**`.
  - Required Prisma/Mongo models plus cache tags.
  - Compliance checklist entries relevant to the function.
- Keep communication artifacts (manifests, ADRs, runbooks) under `orgcentral/docs/` so future contributors and audits can trace every change.
- Reuse abstract services + interfaces whenever possible to maintain interoperability and scalability.

Following this playbook will reproduce the Firebase backend inside OrgCentral with clean service boundaries, strict linting, Next.js 16 optimizations, and the government-ready controls mandated in the architecture and compliance docs.
