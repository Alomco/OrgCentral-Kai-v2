# Codex Handoff (Temporary)

Purpose: Capture the current context so future chats can resume the flow.

## Current focus
- Leave policy management UI is now in `/hr/settings`.
- Permissions registry UI is now in `/org/permissions` with ABAC summary + legacy mapping checklist.
- Permission resources are now seeded on org creation with dot-notation profiles + legacy aliases; need runtime validation/back-compat checks and P2 items (team timesheet view, notification defaults/digest).

## Active context from IDE
- Active file: `docs/ui-ux-gap-analysis.md`
- Open tabs:
  - `docs/ui-ux-gap-analysis.md`
  - `docs/migration-gap-tldr.md`
  - `src/app/(app)/org/abac/_components/abac-policy-editor.tsx`
  - `docs/hr-module-gap-analysis.md`
  - `docs/codex-handoff.md`

## Recent work completed
- Replaced the HR leave types CSV editor with leave policy management UI (create/update/delete) in `/hr/settings`.
- Added leave policy server actions with Zod validation and cache revalidation.
- Added leave policy update/delete UI with approval/compliance flags and effective dates.
- Added compliance template CRUD UI with JSON-based item editing and seed controls in `/hr/compliance`.
- Added compliance template server actions + validators for create/update/delete.
- Added HR policy admin UI for create/edit/publish with applicability controls in `/hr/policies`.
- Emitted org-wide policy-update notifications on publish via policy service notifications.
- Added `/org/permissions` UI with ABAC policy summary, permission resource registry CRUD, and legacy mapping checklist.
- Added permission resource server actions + Zod validation.
- Seeded default permission resources on org creation and converted HR permission profiles to dot-notation with legacy alias support.
- Updated gap docs to reflect permission seeding and pending runtime validation.

## Files added/updated in the last change set
New files:
- `src/app/(app)/hr/settings/_components/leave-policy-config-form.tsx`
- `src/app/(app)/hr/settings/_components/leave-policy-update-form.tsx`
- `src/app/(app)/hr/settings/_components/leave-policy-delete-form.tsx`
- `src/app/(app)/hr/settings/_components/leave-policy-row.tsx`
- `src/app/(app)/hr/settings/leave-policy-form-utils.ts`
- `src/app/(app)/hr/compliance/compliance-template-form-utils.ts`
- `src/app/(app)/hr/compliance/actions/compliance-templates.ts`
- `src/app/(app)/hr/compliance/_components/compliance-templates-manager.tsx`
- `src/app/(app)/hr/compliance/_components/compliance-template-update-form.tsx`
- `src/app/(app)/hr/compliance/_components/compliance-template-delete-form.tsx`
- `src/app/(app)/hr/compliance/_components/compliance-template-row.tsx`
- `src/app/(app)/hr/policies/policy-admin-form-utils.ts`
- `src/app/(app)/hr/policies/policy-admin-actions.ts`
- `src/app/(app)/hr/policies/_components/policy-admin-panel.tsx`
- `src/app/(app)/hr/policies/_components/policy-admin-manager.tsx`
- `src/app/(app)/hr/policies/_components/policy-admin-update-form.tsx`
- `src/app/(app)/hr/policies/_components/policy-admin-row.tsx`
- `src/app/(app)/org/permissions/page.tsx`
- `src/app/(app)/org/permissions/permission-resource-actions.ts`
- `src/app/(app)/org/permissions/permission-resource-form-utils.ts`
- `src/app/(app)/org/permissions/_components/field-error.tsx`
- `src/app/(app)/org/permissions/_components/permission-resource-panel.tsx`
- `src/app/(app)/org/permissions/_components/permission-resource-manager.tsx`
- `src/app/(app)/org/permissions/_components/permission-resource-row.tsx`
- `src/app/(app)/org/permissions/_components/permission-resource-update-form.tsx`
- `src/app/(app)/org/permissions/_components/permission-resource-delete-form.tsx`
- `src/app/(app)/org/permissions/_components/legacy-mapping-panel.tsx`
- `src/server/use-cases/org/permissions/seed-permission-resources.ts`
- `src/server/use-cases/hr/absences/seed-default-absence-types.ts`

Updated files:
- `src/app/(app)/hr/settings/leave-policy-actions.ts`
- `src/app/(app)/hr/settings/_components/leave-policy-config-panel.tsx`
- `src/app/(app)/hr/settings/_components/hr-settings-form.tsx`
- `src/app/(app)/hr/settings/actions.ts`
- `src/app/(app)/hr/settings/schema.ts`
- `src/app/(app)/hr/settings/page.tsx`
- `src/app/(app)/hr/compliance/_components/compliance-templates-panel.tsx`
- `src/server/services/hr/policies/hr-policy-service.operations.mutations.ts`
- `src/server/services/hr/policies/hr-policy-service.notifications.ts`
- `src/server/use-cases/hr/policies/update-hr-policy.ts`
- `src/app/(app)/hr/policies/page.tsx`
- `src/app/(app)/org/_components/org-section-nav.tsx`
- `src/server/use-cases/org/organization/create-organization-with-owner.ts`
- `src/server/api-adapters/org/organization/organization-route-controllers.ts`
- `src/server/security/authorization/permission-utils.ts`
- `src/server/security/authorization/hr-permissions/profiles.ts`
- `docs/ui-ux-gap-analysis.md`
- `docs/hr-module-gap-analysis.md`
- `docs/codex-handoff.md`

## Known issues found earlier (needs follow-up)
- Many unrelated changes in the git worktree (not touched; do not revert).
- Runtime validation still needed for permission registry CRUD/alias mapping and manager/admin flows now that role templates use dot-notation resources.

## Open questions to continue
- None captured yet.
