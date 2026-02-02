# Gap: HR compliance workflow parity

## Current wiring (orgcentral)
- User view: orgcentral/src/app/(app)/hr/compliance/page.tsx
  - Items list: orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx
  - Detail page (real data): orgcentral/src/app/(app)/hr/compliance/[itemId]/page.tsx
  - Detail utils: orgcentral/src/app/(app)/hr/compliance/[itemId]/compliance-item-utils.ts
- Admin view:
  - Templates manager: orgcentral/src/app/(app)/hr/compliance/_components/compliance-templates-manager.tsx
  - Review queue: orgcentral/src/app/(app)/hr/compliance/_components/compliance-review-queue-panel.tsx
  - Bulk assign UI (wired): orgcentral/src/app/(app)/hr/compliance/_components/bulk-assign-dialog.tsx
  - Expiry panel (wired): orgcentral/src/app/(app)/hr/compliance/_components/compliance-expiry-panel.tsx
- API/use-cases:
  - Update item API: orgcentral/src/app/api/hr/compliance/update/route.ts
  - Assign items API: orgcentral/src/app/api/hr/compliance/assign/route.ts
  - Update use-case: orgcentral/src/server/use-cases/hr/compliance/update-compliance-item.ts
  - Types: orgcentral/src/server/types/compliance-types.ts

## Legacy capabilities (old project)
- User compliance log with per-item update (document upload, completion date, yes/no, acknowledgement), status updates, and progress display.
  - old/src/app/(app)/hr/compliance/page.tsx
- Admin compliance hub with task library, template import, assignment dialog, and review workflow with notes/attachments.
  - old/src/app/(app)/hr/admin/ComplianceManagementHub.tsx

## Gaps (new project only)
1) ✅ User-facing submission UI for compliance items (document upload via vault, completion date, yes/no, acknowledgement, notes).
   - ComplianceItemsPanel remains list-only; submissions happen on the detail page.
2) ✅ Compliance item detail page status mapping aligned with current status codes (COMPLETE/MISSING/PENDING_REVIEW/EXPIRED).
3) ✅ Compliance items list resolves template metadata (name, type, guidance, mandatory, internal-only).
4) ✅ Bulk assign dialog wired with templates/employees and assign handler.
5) ✅ Expiry management panel connected to data and mounted on the compliance page.
6) ✅ Category management UI added (list/upsert).
7) ✅ Compliance reporting and analytics implemented (org-level summaries + KPIs).
8) ✅ Automated compliance reminders include configurable cadence/escalation (default 30/14/7/1) with per-org overrides.
9) ⚠️ Compliance audit trail is partial - update/assign/review logged; reminder/expiry events still pending.
10) ✅ Regulatory requirements mapped to categories and template items (regulatoryRefs).

## Gap details (parity notes)

### Document management complexity
Old Project: Highly configurable compliance items (Document, CompletionDate, YesNo, Acknowledgement) with upload flows and rich status tracking (Complete, Pending, Missing, Pending Review, N/A, Expired, Expiring Soon) in old/src/app/(app)/hr/compliance/page.tsx.
New Project: Submission UI and detail views now use real data with vault-backed evidence uploads.
Gap: Expiring Soon is still not a first-class status; expiry warnings are handled via the expiring-items panel instead of a dedicated status.

### Status granularity and expiry lifecycle
Old Project: Displayed Expiring Soon and Expired with date-based warnings and per-item status controls.
New Project: ComplianceItemStatus omits Expiring Soon; expiry warnings are surfaced via the expiring-items panel instead of a status.
Gap: Expiring Soon remains a UI-only warning and is not a stored status.

### Template library and category tooling
Old Project: Admin task library with category/item builder UI, template import, and category metadata in old/src/app/(app)/hr/admin/ComplianceManagementHub.tsx.
New Project: Template creation is JSON-only via orgcentral/src/app/(app)/hr/compliance/_components/compliance-templates-manager.tsx with no category manager.
Gap: Missing visual template builder, category tooling, and structured task library management.

### Internal-only visibility and guidance text
Old Project: Items could be marked internal-only and were filtered from employee views; guidance text was shown alongside each item.
New Project: Compliance items are listed by templateItemId with no internal-only filtering or guidance surfaced (orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx).
Gap: Employees see less context and may see items that should be internal-only.

### Review workflow evidence coverage
Old Project: Review dialog showed submitted evidence (files, yes/no values, completion dates) and required actionable feedback.
New Project: Review queue now renders vault-linked attachments with classification/retention/version metadata and preserves completedAt in review actions.
Gap: Evidence context is mostly restored; remaining work is to add richer expiry/audit snapshots for reminder/expiry events.

### Assignment and visibility at scale
Old Project: Assignment dialog and employee logs provided visibility into who was pending and which items were assigned.
New Project: BulkAssignDialog is not wired (empty templates/employees) and there is no admin employee compliance log view.
Gap: No operational visibility or bulk assignment workflow for compliance at organization scale.

### Reporting and Analytics
Old Project: Had comprehensive reporting capabilities across HR modules.
New Project: Compliance reporting and KPIs are now surfaced in HR reports and dashboard views.
Gap: Advanced analytics and predictive insights are still out of scope for compliance reporting.

### Regulatory Integration
Old Project: May have had basic compliance tracking.
New Project: Compliance templates and categories now map to standards via regulatoryRefs.
Gap: None for regulatory mapping (implemented); audit trails for reminder/expiry events still pending.

## Scope notes
- Compliance reporting surfaces are tracked in `orgcentral/docs/gaps/hr/reporting-analytics-gap.md`.
- Document vault integration and evidence metadata are tracked in `orgcentral/docs/gaps/documents/document-management-gap.md`.
- Employee-level compliance admin views should coordinate with the document and reporting gaps above.

## TODOs
- [x] Analyze and implement user submission UI that calls /api/hr/compliance/update with attachments, completion dates, acknowledgements, and notes.
- [x] Analyze and wire compliance item detail page to real data and align status labels with ComplianceItemStatus.
- [x] Analyze and join compliance items with template metadata to display item names, types, guidance, and internal-only visibility.
- [x] Analyze and wire bulk assignment to templates/employees with an onAssign action backed by assign-compliance-items.
- [x] Analyze and surface expiring items in the compliance page using dueDate/expiryDurationDays and the reminders pipeline.
- [x] Analyze and add a category manager (list/upsert categories) to avoid free-text category keys.
- [x] Implement compliance reporting data sources and metrics (org-level summaries, trends).
- [x] Enhance automated compliance reminders with configurable workflows.
- [ ] Implement complete compliance audit trail with comprehensive logging. (Partial: update/assign/category/review logged; reminder/expiry still pending.)
- [x] Add integration with regulatory requirements and standards mapping.

## Actionable TODOs with targets
- [x] Build interactive item submission UI in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx` or a new client detail view, calling `orgcentral/src/app/api/hr/compliance/update/route.ts` with attachments, completedAt, and notes.
- [x] Replace mock compliance detail page with real data loading in `orgcentral/src/app/(app)/hr/compliance/[itemId]/page.tsx`, and update `orgcentral/src/app/(app)/hr/compliance/[itemId]/compliance-item-utils.ts` to map `ComplianceItemStatus`.
- [x] Add a server join of compliance items + template items (name/type/guidance/isInternalOnly) and use it to render in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx`.
- [x] Filter out internal-only items for employee views while keeping admin visibility (use template metadata, not just item status).
- [x] Wire `orgcentral/src/app/(app)/hr/compliance/_components/bulk-assign-dialog.tsx` with templates and employees and add an onAssign action that calls `orgcentral/src/app/api/hr/compliance/assign/route.ts`.
- [x] Surface expiry data in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-expiry-panel.tsx` and mount it on `orgcentral/src/app/(app)/hr/compliance/page.tsx` with a real expiring-items query.
- [x] Add category manager UI with list/upsert API in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-category-manager.tsx`.
- [x] Build compliance reporting queries + summaries in `src/server/use-cases/hr/compliance/*` and expose via adapter controllers for HR reports.
- [x] Add configurable reminder policies (cadence, escalation rules) in reminder worker/config.
- [ ] Log compliance events (submission, approval, reminder, expiry, evidence changes) with classification/residency metadata. (Partial: update/assign/category/review logged.)
- [x] Map compliance templates/items to regulatory standards and expose for reporting and audits.

## Related gaps
- orgcentral/docs/gaps/hr/reporting-analytics-gap.md
- orgcentral/docs/gaps/comprehensive-feature-gap-analysis.md

## Implementation Status (as of 2026-02-01)

| # | Gap | Status | Implementation |
|---|-----|--------|----------------|
| 1 | User-facing submission UI | ✅ CLOSED | `compliance-item-submission-form.tsx` with vault uploads + metadata for Document/Date/YesNo/Acknowledgement |
| 2 | Detail page mock data / status mapping | ✅ CLOSED | Real data via repositories; correct `ComplianceItemStatus` mapping |
| 3 | Template metadata joined to items | ✅ CLOSED | `getComplianceItemsWithTemplates` joins name/type/guidance/isInternalOnly |
| 4 | Bulk assign dialog wiring | ✅ CLOSED | Templates/employees passed from page; API route called |
| 5 | Expiry panel not connected | ✅ CLOSED | `compliance-expiry-panel-loader.tsx` with real 30-day expiry query |
| 6 | Category management UI | ✅ CLOSED | `compliance-category-manager.tsx` with list/upsert API |
| 7 | Compliance reporting and analytics | ✅ CLOSED | Org-wide analytics summary + KPI cards on reports/dashboard |
| 8 | Automated compliance reminders | ✅ CLOSED | Daily cadence with default 30/14/7/1 escalations + per-org overrides |
| 9 | Compliance audit trail | ⚠️ PARTIAL | Update/assign/category/review events logged; reminder/expiry still pending |
| 10 | Regulatory requirements integration | ✅ CLOSED | Category + template item regulatoryRefs mapped for audits |

### Implemented gaps from this document ✅
- User-facing submission UI
- Detail page with real data
- Template metadata joining
- Bulk assignment workflow
- Expiry panel integration
- Category management UI

### Remaining Work
1. **High Priority:** Complete compliance audit trail for reminder/expiry events
