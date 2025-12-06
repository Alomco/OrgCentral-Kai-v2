# HR Onboarding Parity (old ➜ orgcentral)

Comparison of the legacy HR onboarding flows in `old/` with the current `orgcentral/` codebase. Focus is on employee onboarding, checklist templates/instances, and invitation handling.

## Legacy coverage (old/)
- Full onboarding wizard UI at `old/src/app/(app)/hr/onboarding/OnboardingWizard.tsx` with step files for identity, job/compensation, assignments (leave types + checklist template), and review; launched from `old/src/app/(app)/hr/employees/page.tsx`.
- Email collision check via `checkExistingEmployee` and onboarding invite send via `onboardEmployee` (Firebase callable functions) from `Step1_Identity.tsx` and final submit.
- Checklist template CRUD screen under `old/src/app/(app)/admin/organization/workflows/page.tsx` calling `create/get/update/deleteChecklistTemplate`.
- Active onboarding/offboarding checklist card on employee profile `old/src/app/(app)/hr/employees/[id]/page.tsx` using `getEmployeeActiveChecklist`, `updateChecklistItems`, `completeOnboardingChecklist`, and `completeOffboarding`.
- Legacy function manifest (`docs/backend-function-manifest.json`) lists onboarding endpoints: `checkExistingEmployee`, `onboardEmployee`, `create/get/update/deleteChecklistTemplate`, `getEmployeeChecklists`, `updateEmployeeChecklist`.
- **Flow:** `onboardEmployee` creates an invitation. The user/employee record is created *only* when the user accepts the invitation (in `acceptInvitation`). Checklist is instantiated at that moment.

## Current state (orgcentral/)
- UI: no `/hr` app routes; `orgcentral/src/app/(app)` is empty, so there is no onboarding wizard, checklist UI, or HR dashboard entry points.
- API surface: `/api/hr` only exposes absences, leave, and people CRUD; there is no `/api/hr/onboarding` (invites/checklists/templates) route or server action.
- **Backend Logic:**
  - `onboardEmployeeOperation` (`src/server/services/hr/people/operations/onboard.ts`) creates an `EmployeeProfile` *immediately* (pre-boarding status) and then issues an invitation. This differs from `old/` where the profile was created on accept.
  - `acceptInvitation` (`src/server/use-cases/auth/accept-invitation.ts`) handles user creation and membership linking but is currently generic. It does not handle the specific needs of HR onboarding (linking pre-existing profiles, instantiating checklists).
  - Prisma repos for onboarding invitations and checklist templates/instances live in `src/server/repositories/prisma/hr/onboarding/*`.

## Gaps to close for onboarding parity

### 1. Identity Resolution & Linking (Critical)
- **Problem:** `onboardEmployeeOperation` requires a `userId` to create the pre-boarding profile, but the real user doesn't exist yet. If a placeholder `userId` is used, `acceptInvitation` will later try to create/upsert a profile with the *real* `userId`.
- **Risk:** This will cause a collision on `employeeNumber` (unique constraint) because `acceptInvitation` unknowingly tries to create a duplicate profile instead of linking to the existing pre-boarding one.
- **Fix:** Update `acceptInvitation` to detect if `onboardingData` contains an `employeeNumber`. If so, find the existing "pre-boarding" profile and update its `userId` to the new authenticated `userId` instead of attempting a new creation.

### 2. Checklist Instantiation
- **Problem:** `acceptInvitation` currently ignores the `onboardingTemplateId` stored in the invitation. No checklist instance is created when the user joins.
- **Fix:** enhance `acceptInvitation` (or add a post-acceptance hook) to read `onboardingTemplateId`, fetch the template, and create a `ChecklistInstance` linked to the new employee.

### 3. API & Validation
- Expose onboarding HTTP adapters/routes that call `PeopleOrchestrationService.onboardEmployee`.
- Add an email pre-check endpoint using `check-existing-onboarding-target` to block duplicates early in the wizard.
- Build checklist template CRUD service/adapters and routes (e.g., `/api/hr/onboarding/templates`).
- Build checklist instance APIs for "get active", "update items", "complete/cancel".

### 4. UI Recreation
- Recreate the onboarding wizard UI (identity → role/comp → assignments → review) and hook it to the new APIs.
- Restore admin UI for managing onboarding/offboarding templates.
- Restore employee profile view section showing the active checklist.
