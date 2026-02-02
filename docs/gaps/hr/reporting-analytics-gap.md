# Gap: HR reporting and analytics parity

## Current wiring (orgcentral)
- HR reports page and metrics:
  - orgcentral/src/app/(app)/hr/reports/page.tsx
  - orgcentral/src/app/(app)/hr/reports/reports-utils.ts
- HR dashboard analytics surfaces:
  - orgcentral/src/app/(app)/hr/dashboard/page.tsx
  - orgcentral/src/app/(app)/hr/dashboard/_components/kpi-grid.tsx
  - orgcentral/src/app/(app)/hr/dashboard/_components/manager-snapshot.tsx
- HR admin dashboard stats and quick actions:
  - orgcentral/src/app/(app)/hr/admin/page.tsx
  - orgcentral/src/app/(app)/hr/admin/actions.ts
  - orgcentral/src/app/(app)/hr/admin/_components/hr-admin-quick-actions.tsx
  - Manager snapshot currently shows team leave approvals, absences, timesheets, and anniversaries.

## Legacy capabilities (old project)
- HR dashboard included document-expiry and compliance KPIs for employees/managers:
  - old/src/app/(app)/hr/dashboard/page.tsx
- HR admin center highlighted "HR Reports & Analytics" entry and live pending counts from hubs:
  - old/src/app/(app)/hr/admin/page.tsx

## Scope notes
- This gap owns HR reporting surfaces, admin stats wiring, and exports.
- Compliance reporting data sources are tracked in `orgcentral/docs/gaps/hr/compliance-gap.md`.
- Document vault metadata and expiry signals are tracked in `orgcentral/docs/gaps/documents/document-management-gap.md`.

## Gaps (new project only)
1) ✅ Document/compliance KPIs now surface in HR analytics (dashboard + reports).
2) ✅ HR reports include compliance and document-retention metrics.
3) ✅ HR admin reporting visibility and stats restored (pending approvals + real counts).
4) ✅ HR admin quick actions link to reports.
5) ✅ Cross-module reporting surfaced via the reports insights section.
6) Advanced analytics capabilities are missing - no predictive analytics, trend analysis, or workforce planning tools.
7) ✅ Export functionality now includes CSV/JSON/PDF for reports.

## TODOs
- [x] Analyze and restore document-expiry/compliance KPIs in HR dashboards and reports (compare old HR dashboard to new KPI surfaces).
- [x] Analyze and add compliance/document-expiry metrics to HR reports aggregation (tie into compliance data sources).
- [x] Analyze and wire HR admin reporting visibility plus real pending/stats data (reports link + non-placeholder stats).
- [x] Analyze and link HR admin quick actions to HR reports with role-appropriate routing.
- [x] Implement cross-module reporting capabilities that connect data from different modules.
- [ ] Add advanced analytics features including trend analysis and predictive capabilities.
- [x] Implement comprehensive export functionality for reports and employee data (CSV/JSON/PDF).

## Related gaps
- orgcentral/docs/gaps/documents/document-management-gap.md
- orgcentral/docs/gaps/hr/compliance-gap.md
- orgcentral/docs/gaps/comprehensive-feature-gap-analysis.md

## Implementation Status (as of 2026-02-01)

| # | Gap | Status | Notes |
|---|-----|--------|-------|
| 1 | Document/Compliance KPIs in HR dashboard | ✅ CLOSED | Compliance due + document retention KPIs added |
| 2 | Document/Compliance metrics in HR reports | ✅ CLOSED | Compliance + document retention KPIs + trend cards |
| 3 | HR Admin stats - real data | ✅ CLOSED | Pending approvals + compliance/upcoming expirations wired |
| 4 | HR Admin pending approvals | ✅ CLOSED | Pending approvals populated across HR modules |
| 5 | HR Admin quick actions → Reports link | ✅ CLOSED | Reports entry present in quick actions |
| 6 | Cross-module reporting | ✅ CLOSED | Cross-module insights section added to reports |
| 7 | Advanced analytics | ❌ OPEN | No predictive or trend analysis capabilities |
| 8 | Report export functionality | ✅ CLOSED | CSV/JSON/PDF export endpoint wired |

### Priority Recommendations
1. **High effort:** Create document-expiry use-case tied to compliance item status views
2. **High effort:** Add advanced analytics and predictive capabilities
