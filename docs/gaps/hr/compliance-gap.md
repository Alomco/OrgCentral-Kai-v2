# Gap: HR compliance workflow parity

## Current wiring (orgcentral)
- User view: orgcentral/src/app/(app)/hr/compliance/page.tsx
  - Items list: orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx
  - Detail page (mock data): orgcentral/src/app/(app)/hr/compliance/[itemId]/page.tsx
  - Detail utils: orgcentral/src/app/(app)/hr/compliance/[itemId]/compliance-item-utils.ts
- Admin view:
  - Templates manager: orgcentral/src/app/(app)/hr/compliance/_components/compliance-templates-manager.tsx
  - Review queue: orgcentral/src/app/(app)/hr/compliance/_components/compliance-review-queue-panel.tsx
  - Bulk assign UI (not wired): orgcentral/src/app/(app)/hr/compliance/_components/bulk-assign-dialog.tsx
  - Expiry panel (unused): orgcentral/src/app/(app)/hr/compliance/_components/compliance-expiry-panel.tsx
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
1) No user-facing submission UI for compliance items (document upload, completion date, yes/no, acknowledgement, notes).
   - ComplianceItemsPanel is read-only and the detail page uses mock data.
2) Compliance item detail page status mapping is incompatible with current status codes (COMPLETED/OVERDUE vs COMPLETE/MISSING/PENDING_REVIEW).
3) Compliance items list does not resolve template metadata (name, type, guidance, mandatory, internal-only) and shows templateItemId only.
4) Bulk assign dialog is rendered with empty templates/employees and no onAssign handler, so it cannot assign packs.
5) Expiry management panel exists but is not connected to data or shown on the compliance page.
6) Category management UI is missing; templates use free-text categoryKey with no picker or upsert flow.
7) Compliance reporting and analytics are missing - no comprehensive reporting on compliance status across the organization.
8) Automated compliance reminders and notifications are limited - may lack sophisticated reminder workflows.
9) Compliance audit trail is incomplete - may lack comprehensive logging of all compliance-related actions.
10) Integration with regulatory requirements is missing - no mapping to specific regulations or standards.

## Gap details (parity notes)

### Document management complexity
Old Project: Highly configurable compliance items (Document, CompletionDate, YesNo, Acknowledgement) with upload flows and rich status tracking (Complete, Pending, Missing, Pending Review, N/A, Expired, Expiring Soon) in old/src/app/(app)/hr/compliance/page.tsx.
New Project: Compliance types exist in orgcentral/src/server/types/compliance-types.ts, but the UI is read-only and the detail page uses mock data.
Gap: The old project supported fully interactive document workflows and status transitions; the new project does not surface those capabilities.

### Status granularity and expiry lifecycle
Old Project: Displayed Expiring Soon and Expired with date-based warnings and per-item status controls.
New Project: ComplianceItemStatus omits Expiring Soon and the detail page maps to non-existent status labels (orgcentral/src/app/(app)/hr/compliance/[itemId]/compliance-item-utils.ts).
Gap: Status presentation is inconsistent and expiry lifecycle states are not represented or computed in the UI.

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
New Project: Review queue shows attachments as raw strings and only updates status/notes without capturing completedAt or evidence context (orgcentral/src/app/(app)/hr/compliance/actions/review-item.ts).
Gap: Reviewers lack the evidence context needed to validate submissions and expiry logic is not updated on approval.

### Assignment and visibility at scale
Old Project: Assignment dialog and employee logs provided visibility into who was pending and which items were assigned.
New Project: BulkAssignDialog is not wired (empty templates/employees) and there is no admin employee compliance log view.
Gap: No operational visibility or bulk assignment workflow for compliance at organization scale.

### Reporting and Analytics
Old Project: Had comprehensive reporting capabilities across HR modules.
New Project: Compliance reporting may be limited to basic status displays.
Gap: Missing comprehensive reporting on compliance status, trends, and organizational compliance metrics.

### Regulatory Integration
Old Project: May have had basic compliance tracking.
New Project: No clear evidence of mapping to specific regulations or standards.
Gap: Missing integration with regulatory requirements like SOX, HIPAA, GDPR, etc.

## TODOs
- [x] Analyze and implement user submission UI that calls /api/hr/compliance/update with attachments, completion dates, acknowledgements, and notes.
- [x] Analyze and wire compliance item detail page to real data and align status labels with ComplianceItemStatus.
- [x] Analyze and join compliance items with template metadata to display item names, types, guidance, and internal-only visibility.
- [x] Analyze and wire bulk assignment to templates/employees with an onAssign action backed by assign-compliance-items.
- [x] Analyze and surface expiring items in the compliance page using dueDate/expiryDurationDays and the reminders pipeline.
- [x] Analyze and add a category manager (list/upsert categories) to avoid free-text category keys.
- [ ] Implement comprehensive compliance reporting and analytics dashboard.
- [ ] Enhance automated compliance reminders with configurable workflows.
- [ ] Implement complete compliance audit trail with comprehensive logging.
- [ ] Add integration with regulatory requirements and standards mapping.

## Actionable TODOs with targets
- [x] Build interactive item submission UI in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx` or a new client detail view, calling `orgcentral/src/app/api/hr/compliance/update/route.ts` with attachments, completedAt, and notes.
- [x] Replace mock compliance detail page with real data loading in `orgcentral/src/app/(app)/hr/compliance/[itemId]/page.tsx`, and update `orgcentral/src/app/(app)/hr/compliance/[itemId]/compliance-item-utils.ts` to map `ComplianceItemStatus`.
- [x] Add a server join of compliance items + template items (name/type/guidance/isInternalOnly) and use it to render in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-items-panel.tsx`.
- [x] Filter out internal-only items for employee views while keeping admin visibility (use template metadata, not just item status).
- [x] Wire `orgcentral/src/app/(app)/hr/compliance/_components/bulk-assign-dialog.tsx` with templates and employees and add an onAssign action that calls `orgcentral/src/app/api/hr/compliance/assign/route.ts`.
- [x] Surface expiry data in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-expiry-panel.tsx` and mount it on `orgcentral/src/app/(app)/hr/compliance/page.tsx` with a real expiring-items query.
- [x] Add category manager UI with list/upsert API in `orgcentral/src/app/(app)/hr/compliance/_components/compliance-category-manager.tsx`.
- [ ] Add compliance reporting dashboard with organizational compliance metrics and trends.
- [ ] Enhance reminder system with configurable workflows and escalation rules.
- [ ] Implement comprehensive audit logging for all compliance-related actions.
- [ ] Add regulatory standards mapping and compliance tracking features.

## Related gaps
- orgcentral/docs/gaps/hr/reporting-analytics-gap.md
- orgcentral/docs/gaps/comprehensive-feature-gap-analysis.md

## Implementation Status (as of 2026-01-27)

| # | Gap | Status | Implementation |
|---|-----|--------|----------------|
| 1 | User-facing submission UI | ✅ CLOSED | `compliance-item-submission-form.tsx` with all types (Document, Date, YesNo, Acknowledgement) |
| 2 | Detail page mock data / status mapping | ✅ CLOSED | Real data via repositories; correct `ComplianceItemStatus` mapping |
| 3 | Template metadata joined to items | ✅ CLOSED | `getComplianceItemsWithTemplates` joins name/type/guidance/isInternalOnly |
| 4 | Bulk assign dialog wiring | ✅ CLOSED | Templates/employees passed from page; API route called |
| 5 | Expiry panel not connected | ✅ CLOSED | `compliance-expiry-panel-loader.tsx` with real 30-day expiry query |
| 6 | Category management UI | ✅ CLOSED | `compliance-category-manager.tsx` with list/upsert API |
| 7 | Compliance reporting and analytics | ❌ OPEN | Missing comprehensive reporting dashboard |
| 8 | Automated compliance reminders | ⚠️ PARTIAL | Basic reminders exist, advanced workflows missing |
| 9 | Compliance audit trail | ❌ OPEN | Incomplete logging of compliance actions |
| 10 | Regulatory requirements integration | ❌ OPEN | No mapping to specific regulations/standards |

### Implemented gaps from this document ✅
- User-facing submission UI
- Detail page with real data
- Template metadata joining
- Bulk assignment workflow
- Expiry panel integration
- Category management UI

### Remaining Work
1. **High Priority:** Implement comprehensive compliance reporting and analytics
2. **Medium Priority:** Enhance automated compliance reminders with configurable workflows
3. **High Priority:** Implement complete compliance audit trail
4. **High Priority:** Add integration with regulatory requirements and standards mapping
