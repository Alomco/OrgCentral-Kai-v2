# Gap: Document management workflows

## Current wiring (orgcentral)
- Document vault routes and UI are now wired:
  - orgcentral/src/app/api/hr/documents/route.ts
  - orgcentral/src/app/api/hr/documents/presign/route.ts
  - orgcentral/src/app/api/hr/documents/[documentId]/download/route.ts
  - orgcentral/src/app/(app)/hr/documents/page.tsx
  - orgcentral/src/server/use-cases/records/documents/*
- Compliance attachments are vault-linked with metadata:
  - orgcentral/src/server/types/hr-compliance-schemas.ts
  - orgcentral/src/server/use-cases/hr/compliance/update-compliance-item.ts
  - orgcentral/src/app/(app)/hr/compliance/_components/compliance-item-submission-form.tsx
  - orgcentral/src/app/(app)/hr/compliance/_components/compliance-review-queue-panel.tsx
- Document expiry worker exists but is scoped to work permits in employee profiles (not vault retention or compliance item status):
  - orgcentral/src/server/use-cases/hr/compliance/process-document-expiry.ts

## Legacy behavior (old project)
- Document compliance supported upload flows, allowed file types, and per-item statuses including Expired/Expiring Soon:
  - old/src/app/(app)/hr/compliance/page.tsx
  - old/src/lib/hr/types.ts
- Employee profiles included a Documents tab with an admin compliance log, assignment, review, and per-item document controls:
  - old/src/app/(app)/hr/employees/[id]/page.tsx
  - old/src/app/(app)/hr/employees/[id]/AdminComplianceManager.tsx
- HR dashboards surfaced documents-expiring KPIs and quick actions for document upload/review:
  - old/src/app/(app)/hr/dashboard/page.tsx

## Scope notes
- This gap owns the document vault integration, metadata, and evidence storage model.
- HR dashboard/report KPIs are tracked in `orgcentral/docs/gaps/hr/reporting-analytics-gap.md`.
- Employee compliance admin views should coordinate with `orgcentral/docs/gaps/hr/compliance-gap.md`.

## Gaps (document management complexity)
1) ✅ Document vault UI/routes to store/retrieve documents with classification/retention/versioning.
2) ✅ Compliance evidence stored as vault-linked metadata (not raw strings).
3) ✅ File upload UX for compliance items with allowedFileTypes enforcement.
4) ✅ Document classification/retention fields exposed in upload flows.
5) ⚠️ Document expiry workflows are not yet tied to document vault retention or compliance item statuses (expiring/expired).
6) ✅ Review queue shows vault-linked attachments with metadata.
7) ✅ HR dashboards/reports surface document retention KPIs.
8) ❌ Employee detail view still lacks admin compliance log experience.

## TODOs
- [x] Expose document vault routes + UI to list/store documents with classification, retention, and version metadata.
- [x] Link compliance attachments to document vault records (store pointer + metadata).
- [x] Implement compliance evidence upload UI with allowedFileTypes enforcement and audit logging.
- [x] Surface document classification/retention inputs where documents are created or updated.
- [ ] Connect document retention/expiry states to compliance item statuses and UI warnings.
- [x] Enhance review queue evidence display with document metadata and download links.
- [x] Coordinate with HR reporting to surface document-retention KPIs once vault metadata is available.
- [ ] Coordinate with HR compliance to add employee-level compliance log admin view after vault integration.

## Related gaps
- orgcentral/docs/gaps/hr/compliance-gap.md
- orgcentral/docs/gaps/hr/absence-management-granularity-gap.md
