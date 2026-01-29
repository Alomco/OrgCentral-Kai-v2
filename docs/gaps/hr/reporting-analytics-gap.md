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

## Legacy capabilities (old project)
- HR dashboard included document-expiry and compliance KPIs for employees/managers:
  - old/src/app/(app)/hr/dashboard/page.tsx
- HR admin center highlighted "HR Reports & Analytics" entry and live pending counts from hubs:
  - old/src/app/(app)/hr/admin/page.tsx

## Gaps (new project only)
1) Document/compliance KPIs are missing from HR analytics surfaces.
   - Old dashboard surfaced "Documents Expiring" and "Compliance" tiles; new HR dashboard and reports page omit those signals.
2) HR reports do not include compliance or document-expiry metrics, despite compliance workflows being core in the old dashboard.
3) HR admin reporting visibility is reduced and stats are placeholders.
   - New admin quick actions do not link to reports, and `getAdminDashboardStats`/`getPendingApprovals` return placeholder values.
   - Old admin center exposed a reports entry and live pending counts from hubs.
4) HR admin reporting visibility is not linked to reports from the admin dashboard quick actions.
   - New admin quick actions omit reports; old admin center exposed a reports entry.
5) Cross-module reporting is missing - no comprehensive reporting connecting data from different modules (e.g., how training affects performance).
6) Advanced analytics capabilities are missing - no predictive analytics, trend analysis, or workforce planning tools.
7) Export functionality for reports is limited or missing - no comprehensive export options for employee data or analytics.

## TODOs
- [ ] Analyze and restore document-expiry/compliance KPIs in HR dashboards and reports (compare old HR dashboard to new KPI surfaces).
- [ ] Analyze and add compliance/document-expiry metrics to HR reports aggregation (tie into compliance data sources).
- [ ] Analyze and wire HR admin reporting visibility plus real pending/stats data (reports link + non-placeholder stats).
- [ ] Analyze and link HR admin quick actions to HR reports with role-appropriate routing.
- [ ] Implement cross-module reporting capabilities that connect data from different modules.
- [ ] Add advanced analytics features including trend analysis and predictive capabilities.
- [ ] Implement comprehensive export functionality for reports and employee data.

## Related gaps
- orgcentral/docs/gaps/documents/document-management-gap.md
- orgcentral/docs/gaps/hr/compliance-gap.md
- orgcentral/docs/gaps/comprehensive-feature-gap-analysis.md

## Implementation Status (as of 2026-01-27)

| # | Gap | Status | Notes |
|---|-----|--------|-------|
| 1 | Document/Compliance KPIs in HR dashboard | ❌ OPEN | KPI grid shows leave/attendance only, no compliance tiles |
| 2 | Document/Compliance metrics in HR reports | ❌ OPEN | `OrganizationPulseStats` lacks document/compliance fields |
| 3 | HR Admin stats - real data | ⚠️ PARTIAL | Employee counts real; `pendingLeaveRequests`, `complianceAlerts`, `upcomingExpirations` hardcoded to 0 |
| 4 | HR Admin pending approvals | ❌ OPEN | `getPendingApprovals` returns empty array placeholder |
| 5 | HR Admin quick actions → Reports link | ❌ OPEN | No `/hr/reports` entry in quick actions |
| 6 | Cross-module reporting | ❌ OPEN | No connection between different HR modules for reporting |
| 7 | Advanced analytics | ❌ OPEN | No predictive or trend analysis capabilities |
| 8 | Report export functionality | ❌ OPEN | Limited or missing export options |

### Priority Recommendations
1. **Low effort:** Add `/hr/reports` link to `hr-admin-quick-actions.tsx`
2. **Medium effort:** Wire `pendingLeaveRequests` in admin stats (leave service exists)
3. **High effort:** Create document-expiry use-case and add KPI tiles
4. **High effort:** Implement cross-module reporting capabilities
5. **High effort:** Add advanced analytics and predictive capabilities
