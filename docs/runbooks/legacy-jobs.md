# Legacy Firebase Jobs Inventory

## Purpose
- Track every remaining Firebase callable, Firestore trigger, storage trigger, and scheduled job so we can migrate them to BullMQ/Next.js services without missing org/compliance behaviors.
- Capture compliance metadata (residency, classification, audit cadence) plus target replacements (service/repository, cache tags, worker name) per the backend replication roadmap.
- Provide a single source of truth for decommissioning Firebase once BullMQ workers and queue infrastructure ship.

## Legend
- **Trigger**: `callable`, `https`, `firestore.update`, `firestore.create`, `storage.finalize`, `scheduler`, etc.
- **Schedule/Path**: Cron text (`every day 01:00`) or Firestore/Storage path (`organizations/{orgId}/employees/{userId}/complianceLog/{categoryKey}`).
- **Residency**: `UK`, `EU`, `Global` (use dual tags when data crosses regions).
- **Classification**: `OFFICIAL`, `OFFICIAL-SENSITIVE`, `SECRET` (see `old/docs/requirements/02-security-and-compliance.md`).
- **Target Surface**: Name of the new BullMQ worker/service + cache tag(s) that must be invalidated.
- **Status**: `legacy-only`, `dual-run`, `replaced`, `decommissioned`.

## Inventory
| Legacy Name | File | Trigger | Schedule/Path | Residency | Classification | Current Behavior Summary | Target Surface | Cache/Audit Notes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| checkComplianceExpiries | `old/firebase/functions/src/functions/hr-compliance.ts` | `scheduler` | `every day 01:00 Europe/London` against `collectionGroup('complianceLog')` | UK | OFFICIAL-SENSITIVE | Iterates every employee compliance log and flips item status to `Expired`/`Expiring Soon` based on expiry metadata, indirectly firing `onComplianceLogUpdated`. | `src/server/workers/hr/compliance/reminder-worker.ts` (BullMQ) + `ComplianceStatusService` | Must invalidate `HR_COMPLIANCE` cache tags per org + classification; log audit events for status changes. | legacy-only |
| onComplianceLogUpdated | `old/firebase/functions/src/functions/hr-compliance.ts` | `firestore.update` | `organizations/{orgId}/employees/{userId}/complianceLog/{categoryKey}` | UK | OFFICIAL-SENSITIVE | Recalculates category + overall compliance RAG status, writes back to employee doc, manages pending verifications. | `ComplianceStatusProjector` inside HR compliance service layer (cache component) | Needs cache tag refresh for `HR_COMPLIANCE` and audit trail for verification state transitions. | legacy-only |
| analyzeAbsenceDocument | `old/firebase/functions/src/functions/hr-absences.ts` | `storage.object.finalize` | `organizations/{orgId}/unplannedAbsences/{absenceId}/attachments/*` | UK | OFFICIAL-SENSITIVE | Triggers Vision+Gemini analysis on uploaded absence evidence, updates `aiValidation` status and issues list on absence doc. | `src/server/workers/hr/absences/ai-validation-worker.ts` + `AbsenceIncidentService` | Emits `hr.absences.ai_validation` audit events, invalidates absence cache tags (`HR_ABSENCES` + residency). | legacy-only |

## Methodology
1. Use `rg "exports\." old/firebase/functions/src/functions` to enumerate every callable/trigger, then classify trigger type (`onCall`, `onDocumentUpdated`, `onSchedule`, `onObjectFinalized`, etc.).
2. Read each function to capture Firestore/Storage paths, background schedules, and implicit tenancy/residency handling (e.g., `organizationId` args, collection scoping).
3. Map each job to new services/repositories outlined in `docs/backend-replication-roadmap.md`, `docs/backend-migration-plan.md`, and `docs/migration-task-breakdown.md`.
4. Tag compliance attributes from `old/docs/requirements/02-security-and-compliance.md`; where unknown, flag `TBD` and note required SME input.
5. Track validation requirements: lint/test target, cache invalidation proof, audit log expectations, and documentation updates (runbooks/ADRs).

## Open Questions
- [ ] Are there additional cron sources outside `old/firebase/functions/src/functions` (historically `src/cron`)? Confirm via repo history or maintainers.
- [ ] Do any callable functions still rely on Pub/Sub topics that must be replicated before shutdown?
- [ ] Which notification templates referenced by legacy jobs already exist in Postgres versus Firebase Storage JSON?
