# Backend Replication Roadmap

This document gives every contributor (human or agent) a shared understanding of the remaining backend replication work. It captures the essential knowledge, immutable engineering constraints (files ≤250 LOC, SOLID layering, cache-aware services, reusability-first design), and a phase-wise plan that can be executed in parallel without losing architectural discipline.

---

## 1. Context Snapshot
- **API coverage**: Compliance, Leave, Onboarding, People, and Absence HTTP layers (route → controller → use case) are online and type-safe.
- **Data tier**: Prisma Postgres modules plus adjunct Mongo schemas exist, but several async data movers (leave accrual sync, compliance rollups, onboarding reminders) are still tied to the legacy Firebase triggers.
- **Critical gap**: The Firebase Scheduled Functions + background triggers that handled accruals, audits, and notifications must be ported to BullMQ/Redis workers operating under the new repository/services contracts.
- **Telemetry**: Structured logger + OTEL base classes are ready; every new worker must integrate with them for audit and residency tracking.

---

## 2. Non-Negotiable Engineering Standards
- **LOC discipline**: Keep every file under ~250 LOC by composing helpers/factories instead of enlarging monoliths.
- **SOLID layering**:
  - Contracts in `src/server/repositories/contracts/**` and `src/server/services/**`.
  - Concrete Prisma or Mongo implementations beside contracts.
  - Dependency injection via constructors or provider factories (no global singletons beyond documented providers).
- **Cache + compliance**:
  - Register cache tags on reads (`registerComplianceItemsCache`, etc.) and invalidate after mutations.
  - Persist `orgId`, `dataResidency`, `dataClassification`, and `schemaVersion` on every write.
- **Telemetry & security**:
  - Use `executeInServiceContext` and `StructuredLogger` inside services/workers.
  - All background jobs must call `getSessionContext`-equivalent repository authorization helpers or accept a `RepositoryAuthorizationContext`.
- **Reusability-first**:
  - Avoid bespoke logic in workers; delegate to services/repositories.
  - Workers should orchestrate tasks, not implement business rules.
- **single source of truth**:
  - Notification templates stored in Postgres, not hardcoded in workers.
  - Scheduling configurations (cron expressions, intervals) stored in config files or environment variables.
- **Zero trust handoff**:
  - Each subtask must include source references, destination skeletons, contracts to use, validation steps, and documentation artifacts.

---

## 3. Phase-Wise Plan (Async & Background Layer)

### Phase A – Legacy Job Inventory
> Status: ✅ Completed 2025-12-07 — see `docs/runbooks/legacy-jobs.md` for the full callable/trigger inventory and target mappings.
1. **Enumerate Firebase jobs**
   - Source: `old/firebase/functions/src/functions/*.ts` and `cron/*.ts`.
   - Output: `docs/runbooks/legacy-jobs.md` with trigger type, schedule, Firestore paths, tenancy notes.
2. **Classify compliance level**
   - Tag each job with residency requirements, classification (OFFICIAL, SECRET), audit cadence, and retention obligations.
3. **Identify service touchpoints**
   - Map each job to the new repositories/services (e.g., leave accrual → `LeaveBalanceService`, onboarding reminders → `OnboardingChecklistService`).

### Phase B – BullMQ Foundation
1. **Queue configuration**
   - Create `src/server/workers/config/queue-registry.ts` exposing `getQueue(name, options)` with Redis connection pooling.
   - Define queue names + cache tags in `src/server/workers/constants.ts`.
2. **Abstract worker base**
   - Implement `AbstractOrgWorker` (extends `AbstractBaseService`) handling org context validation, retry/backoff defaults, and OTEL span wiring.
3. **Scheduler shim**
   - Replace Firebase cron with a `SchedulerService` that enqueues recurring jobs (use `ms` strings or `cron` expressions stored in config).

### Phase C – Domain Workers (build in parallel, each <250 LOC per file)
1. **Leave accrual sync**
   - Worker: `src/server/workers/hr/leave/accrual-worker.ts`.
   - Tasks: fetch entitlements, call `LeaveBalanceService.syncAccruals`, invalidate `HR_LEAVE` cache tags, emit audit logs.
2. **Compliance reassignment & reminders**
   - Worker: `src/server/workers/hr/compliance/reminder-worker.ts`.
   - Tasks: list overdue compliance items, send notifications via `NotificationService`, schedule follow-up jobs.
3. **Onboarding checklist nudges**
   - Worker: `src/server/workers/hr/onboarding/reminder-worker.ts`.
   - Tasks: query `ChecklistInstanceRepository`, enqueue email tasks, mark `remindedAt` stamps.
4. **Absence AI validation sweep**
   - Worker: `src/server/workers/hr/absences/ai-validation-worker.ts` hooking into `AbsenceIncidentService` + AI adapters, persisting results with residency metadata.
5. **People data retention + SAR prep**
   - Worker: `src/server/workers/hr/people/retention-worker.ts`.
   - Tasks: enforce retention policies, queue Subject Access Request exports, dual-write to Mongo `auditLogs`.

### Phase D – Notification + Email Pipelines
1. **Notification fan-out queue**
   - `src/server/workers/notifications/dispatcher-worker.ts` reads unified notification jobs and dispatches to configured notification adapters.
2. **Template registry**
   - Store templates in Postgres (`NotificationTemplateRepository`), cache via tag `notifications:templates`, and hydrate payloads inside workers.
3. **Governance hooks**
   - Every notification job records audit events (who triggered, target org/classification) using `StructuredLogger`.

### Phase E – Observability, QA, and Hand-off
1. **Runbooks**
   - Document each worker in `docs/runbooks/<domain>-worker.md` covering: purpose, schedules, dependencies, failure recovery, and escalation paths.
2. **Dashboards + alerts**
   - Add OTEL metrics (queue depth, success/failure counts) and wire alerts via the existing telemetry stack.
3. **Testing & CI gates**
   - Add Vitest suites for worker logic.
   - Update `pnpm lint` scope to include `src/server/workers/**`.
   - Ensure `pnpm test --filter workers` runs in CI before deployment.

---

## 4. Task Handoff Checklist
For each subtask above, create a ticket/snippet that includes:
1. **Source reference** – legacy file/function name.
2. **Destination skeleton** – target directories + file stubs.
3. **Contracts to use** – repository/service interfaces and cache helper expectations.
4. **Validation steps** – lint, targeted tests, cache invalidation proof, audit log sample.
5. **Documentation artifacts** – runbook updates or ADR references.

Following this roadmap keeps the migration scalable, testable, and compliant while making it easy for multiple chats/agents to collaborate without overwriting each other or violating the ≤250 LOC & SOLID mandates.
