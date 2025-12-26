# HR Compliance (orgcentral)

## Current state

The modern compliance module currently supports:

- Templates stored in Prisma (see `PrismaComplianceTemplateRepository`) with `categoryKey`, `version`, and JSON-backed `items`.
- User compliance log items with:
  - `categoryKey`
  - statuses including `PENDING_REVIEW`
  - `reviewedBy` / `reviewedAt`
  - `dueDate`, attachments, and freeform metadata.
- Basic use-cases:
  - Assign items from a template to users (`assign-compliance-items.ts`)
  - List items for a user (`list-compliance-items.ts`)
  - Update an item (`update-compliance-item.ts`)
  - Recalculate compliance status (`get-compliance-status.ts`)
- Repository support for finding expiring items (`findExpiringItemsForOrg`).

## Gap register / TODOs (legacy parity)

Reference (legacy): `old/src/app/(app)/hr/admin/ComplianceManagementHub.tsx` (as described in project notes).

### 1) Default template seeding (UK employment pack)

- ✅ Done (baseline): Added an idempotent default-template seeder that writes templates to Prisma.
  - Use-case: `src/server/use-cases/hr/compliance/seed-default-templates.ts`
  - API: `POST /api/hr/compliance/templates/seed` (optional `?force=1`)
  - Behavior: creates a versioned template with `metadata.seedKey` + `metadata.seedVersion` per org.

- TODO: Expand the default seed data to match the full legacy UK employment template (categories and item coverage) once the legacy template source is available in-repo.

### 2) Category/grouping support (UI + API)

- ✅ Done (baseline): Added a first-class category registry (labels/order) stored in Prisma.
  - API: `GET /api/hr/compliance/categories`
  - API: `PUT /api/hr/compliance/categories` (upsert `{ key, label, sortOrder? }`)
- ✅ Done (baseline): Added a grouped list use-case + API endpoint.
  - Use-case: `src/server/use-cases/hr/compliance/list-compliance-items-grouped.ts`
  - API: `GET /api/hr/compliance/list-grouped?userId=<uuid>`

Note: The `/hr/compliance` UI now consumes the grouped use-case and displays category labels from the registry.

### 3) Reminder + expiry notifications

- ✅ Done (infrastructure): Scheduled reminders exist via worker + cron trigger.
  - Worker: `src/server/workers/hr/compliance/reminder.worker.ts`
  - Cron trigger: `src/server/api-adapters/cron/compliance-reminders.ts`
  - Repo helper: `findExpiringItemsForOrg(orgId, referenceDate, daysUntilExpiry)`
- ✅ Done (baseline): Reminders respect per-template-item rules.
  - `reminderDaysBeforeExpiry` is applied per `templateItemId` (and can expand the scan window beyond the cron default).
  - `expiryDurationDays` is used to derive `dueDate` when an item is completed without an explicit `dueDate`.

### 4) Document verification workflow (admin review queue)

- ✅ Done (baseline): Admin review queue is available on `/hr/compliance` for org-level viewers.
  - List: `GET /api/hr/compliance/review-queue`
  - Actions: Approve/Reject via server action (`reviewedBy/reviewedAt` stamped and status updated).

- ✅ Done (baseline): Review queue shows attachments + notes and supports rejection notes input.

## Notes

- The modern schema already includes primitives needed for review (`PENDING_REVIEW`, `reviewedBy`, `reviewedAt`) and expiry scanning.
- What’s missing is orchestration: a template seeding service, grouped/category projection for UI, and background jobs + review queue endpoints.
