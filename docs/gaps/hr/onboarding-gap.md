# Gap: HR onboarding flow parity

## Legacy behavior (old project)
- Multi-step wizard: identity, job/comp, assignments, review.
- Identity step captured first/last names and checked for:
  - existing employee record in org
  - existing OrgCentral auth user outside org with CTA to invite via user management
- **Employee ID Generation:** Included a "Generate ID" button (`handleGenerateId`) for `EMP-XXXXXX` format.
- **Department Selection:** Loose text input or string-based select.
- Assignments step sourced leave types from org configuration.
- Onboarding checklist selection only from onboarding templates.
- Job/comp captured pay basis (annual/hourly) and pay schedule.

## Current behavior (orgcentral)
- Wizard exists at orgcentral/src/app/(app)/hr/onboarding/wizard.
- **Identity Step:** Successfully captures `firstName`, `lastName`, and `employeeNumber`, but `employeeNumber` input is manual-only (no generator).
- **Department Selection:** Strict UUID validation (`departmentId`). Requires departments to exist in the database; cannot handle legacy string values without migration.
- Leave types default to a static list in wizard/assignments-step.tsx.
- Templates are loaded without type filtering in getChecklistTemplatesForUi.
- **Accessibility:** excellent WCAG 2.1 compliance (labels, ARIA, error handling) via `IdentityStep.tsx` and Radix UI components.

## Gaps (new project only)
1) **Employee ID Generation:** Missing the "Generate ID" helper button. Users must manually invent unique IDs.
2) **Department Data Migration:** Legacy "string" departments will break the new "UUID" department selector. A data migration script is required.
3) Leave type selection is static and not tied to org-configured leave types.
4) Onboarding checklist selection is not filtered to onboarding templates (offboarding/custom templates can appear).
5) Email existence checks do not surface existing OrgCentral users outside the org (no CTA to invite them).
6) Pay basis/hourly wage support is missing versus the old wizard.
7) **Offboarding module:** Missing complete employee lifecycle with offboarding functionality.
8) **Automated task assignments:** Missing automated task assignments and reminders during onboarding.
9) **Integration with IT systems:** Missing integration with IT systems for equipment, accounts, etc.
10) **Mentor assignment:** Missing mentor assignment and tracking capabilities.
11) **Onboarding success metrics:** Missing onboarding success metrics and feedback collection.
12) **Customizable workflows:** Missing customizable onboarding workflows for different roles/teams.
13) **Automated email sequences:** Missing automated email sequences during onboarding process.
14) **Document templates:** Missing document templates for offer letters, contracts, etc.

## TODOs
- [ ] **High Priority:** Implement server-side `generateNextEmployeeId` action and add "Generate" button to `IdentityStep`.
- [ ] **High Priority:** Create migration script to convert legacy string departments to `Department` entities (UUIDs).
- [x] Analyze and wire department loading into the onboarding wizard page so departmentId can be set.
- [x] Analyze and replace static leave types with org-configured leave type options and validation.
- [x] Analyze and filter onboarding checklist selection to onboarding templates only.
- [x] Analyze and add existing auth-user detection + invite CTA for cross-org users.
- [x] Analyze and restore pay basis/hourly wage capture and mapping to contract/profile fields.
- [ ] Implement complete offboarding module to close the employee lifecycle.
- [ ] Add automated task assignments and reminders during onboarding.
- [ ] Integrate with IT systems for equipment, accounts, and access provisioning.
- [ ] Implement mentor assignment and tracking capabilities.
- [ ] Add onboarding success metrics and feedback collection mechanisms.
- [ ] Create customizable onboarding workflows for different roles/teams.
- [ ] Implement automated email sequences during the onboarding process.
- [ ] Add document templates for offer letters, contracts, and other onboarding documents.

## Related gaps
- orgcentral/docs/gaps/hr/offboarding-gap.md
- orgcentral/docs/gaps/comprehensive-feature-gap-analysis.md

## Implementation Status (as of 2026-01-27)

| # | Gap | Status | Notes |
|---|-----|--------|-------|
| 1 | Employee ID generation button | ❌ OPEN | No `generateNextEmployeeId` action or button exists |
| 2 | Department handling (UUID) | ✅ IMPLEMENTED | Uses UUID-based `departmentId`; migration script for legacy strings still needed |
| 3 | Leave type selection | ✅ IMPLEMENTED | Loads from `hrSettings.leaveTypes` via org config |
| 4 | Checklist filtering | ✅ IMPLEMENTED | Filters by `type: 'onboarding'` in `getChecklistTemplatesForUi` |
| 5 | Email existence checks | ✅ IMPLEMENTED | `checkEmailForOnboarding` surfaces `auth_user` with CTA to `/org/members` |
| 6 | Pay basis / hourly wage | ✅ IMPLEMENTED | Full ANNUAL/HOURLY toggle with `salaryBasis`, `hourlyRate`, `annualSalary` |
| 7 | Offboarding module | ❌ OPEN | Missing complete employee lifecycle |
| 8 | Automated task assignments | ❌ OPEN | Missing automated reminders and tasks |
| 9 | IT system integration | ❌ OPEN | No integration with IT for equipment/accounts |
| 10 | Mentor assignment | ❌ OPEN | No mentor assignment capabilities |
| 11 | Success metrics & feedback | ❌ OPEN | No metrics collection during onboarding |
| 12 | Customizable workflows | ❌ OPEN | Fixed workflow for all roles |
| 13 | Automated email sequences | ❌ OPEN | No automated communication |
| 14 | Document templates | ❌ OPEN | Missing templates for onboarding docs |

### Remaining Work
1. **High Priority:** Implement `generateNextEmployeeId` server action (format: `EMP-XXXXXX`)
2. **High Priority:** Create department migration script for legacy string → UUID conversion
3. **High Priority:** Implement complete offboarding module
4. **Medium Priority:** Add automated task assignments and reminders
5. **High Priority:** Integrate with IT systems for equipment and access provisioning
