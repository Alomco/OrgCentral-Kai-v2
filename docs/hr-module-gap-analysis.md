# HR Module Gap Analysis: Legacy (old/) vs. Modern (orgcentral/)

**Date:** 2 January 2026  
**Purpose:** Comprehensive comparison of HR features between the legacy Firebase-based project and the new Prisma/Next.js-based OrgCentral project.

---

## Executive Summary

The new OrgCentral HR module has made significant progress in re-implementing core HR functionality with improved architecture (SOLID principles, repository pattern, multi-tenancy compliance). Remaining gaps concentrate around compliance template seed completeness, leave policy admin hub integration, team time tracking views, and notification defaults/digest options.

### Overall Progress: ~93% Feature Parity

| Category | Legacy Features | Modern Implementation | Status |
|----------|-----------------|----------------------|--------|
| **Leave Management** | 6 | 5 | Near Complete |
| **Absences** | 7 | 7 | Complete |
| **Compliance** | 8 | 7 | Near Complete |
| **Onboarding** | 9 | 9 | Complete |
| **Employee Profiles** | 12 | 12 | Complete |
| **Performance** | 5 | 5 | Complete |
| **Training** | 4 | 4 | Complete |
| **Time Tracking** | 4 | 3 | Near Complete |
| Policies | 5 | 4 | Near Complete |
| **Notifications** | 4 | 4 | Complete |
| **Admin Hub** | 4 | 4 | Complete |
| **Permissions/RBAC/ABAC** | 56+ | ~40 | Partial |

---

## Cross-Cutting Updates (Jan 2026)

- Org security settings now support IP allowlist entries; HR access flows should expect allowlist blocks when enabled.
- Billing cadence now supports monthly/annual per-employee pricing (admin context, not HR-specific).
- Billing cadence/auto-renew changes now sync to Stripe subscriptions (admin context).
- Org profile is now editable with audit logging and cache invalidation (admin context).
- Org-level notification defaults apply to platform notifications; HR notifications still rely on per-user preferences only.
- Permission registry seeds now use dot-notation HR resources; role templates migrated off legacy resource keys while maintaining alias back-compat.
- New org provisioning now seeds default absence types (sickness, personal leave, unpaid leave) to keep absence reporting unblocked.

---

## 1. Leave Management

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Submit leave request | `submitLeaveRequest` callable | OK `submit-leave-request.ts` |
| Approve leave request | `approveLeaveRequest` callable | OK `approve-leave-request.ts` |
| Reject leave request | `rejectLeaveRequest` callable | OK `reject-leave-request.ts` |
| Cancel leave request | `cancelLeaveRequest` in service | OK `cancel-leave-request.ts` |
| View leave balances | `getEmployeeBalances` | OK `get-leave-balance.ts` |
| Configure leave types | `addLeaveType` callable | OK `/hr/settings` leave policy UI (create/update/delete) |

### Modern Improvements
- OK Hours-based tracking (not just days)
- OK Half-day leave support via form
- OK Policy-based accrual rules (`LeavePolicyAccrual` model)
- OK UK statutory compliance fields
- OK Negative balance support for emergency leave
- OK Cache layer with tenant-scoped invalidation

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Leave Request Form | OK `/hr/leave/page.tsx` | OK `/hr/leave/page.tsx` | Full parity |
| Leave Balances Display | OK On leave page | OK `LeaveRequestsPanel` | Full parity |
| Admin Leave Approval | OK `LeaveManagementHub.tsx` | OK `leave-management-hub.tsx` | Admin hub tab with bulk approvals |

### Gaps
1. Partial **Leave Policy Management** - `/hr/settings` now supports create/update/delete policies; admin hub integration and richer accrual/eligibility tooling still pending

---

## 2. Absences (Unplanned)

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Log unplanned absence | `logUnplannedAbsence` | OK `report-unplanned-absence.ts` |
| Return-to-work submission | `submitReturnToWork` | OK `record-return-to-work.ts` |
| Admin acknowledgment | `acknowledgeAbsence` | OK `acknowledge-unplanned-absence.ts` |
| Admin cancellation | `adminCancelAbsence` | OK `cancel-unplanned-absence.ts` |
| AI document validation | Vision API + Vertex AI | OK `ai-validation.service.ts` |
| Absence type config | `addAbsenceType`/`removeAbsenceType` | OK UI in `/hr/settings` + `create/update-absence-type-config.ts` |
| Attachments upload | File upload in log form | OK `add-absence-attachments.ts` |

### Modern Improvements
- OK AI validation worker with async processing
- OK Better attachment management (add/remove)
- OK Cached absence retrieval with tenant scoping
- OK Absence types configurable via `/hr/settings`, report form uses DB-backed active types

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Report Absence Form | OK `/hr/absences/page.tsx` | OK `/hr/absences/page.tsx` | Uses org-configured absence types |
| Absence List | OK On absences page | OK `AbsenceListPanel` | Full parity |
| Admin Absence Hub | OK `AbsenceManagementHub.tsx` | OK `absence-management-hub.tsx` | Admin hub tab with acknowledgment queue |

### Gaps
- None. Default absence types are seeded during org creation (sickness, personal leave, unpaid leave) as of Jan 2026.

---

## 3. Compliance / Document Management

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Template library | `getTaskLibrary`/`updateTaskLibrary` | OK `/hr/compliance` templates CRUD + seed actions |
| Assign compliance items | `assignComplianceItems` | OK `assign-compliance-items.ts` |
| Employee item update | `updateComplianceItem` | OK `update-compliance-item.ts` |
| Admin review queue | `adminReviewComplianceItem` | OK `list-pending-review-items.ts` |
| Expiry notifications | Scheduled function | OK `reminder.worker.ts` |
| Category grouping | In template library | OK `list-compliance-items-grouped.ts` |
| RAG status calculation | Trigger-based | OK `get-compliance-status.ts` |
| Document uploads | Firebase Storage | OK Via attachments |

### Modern Improvements
- OK Category registry with labels/ordering
- OK Review queue with approve/reject UI
- OK Template versioning with `seedKey`/`seedVersion`
- OK Idempotent default template seeding

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Personal Compliance | OK `/hr/compliance/page.tsx` | OK `/hr/compliance/page.tsx` | Full parity |
| Compliance Templates | OK Admin hub | OK `ComplianceTemplatesPanel` | CRUD manager in `/hr/compliance` |
| Review Queue | OK Admin hub | OK `ComplianceReviewQueuePanel` | Full parity |
| Admin Compliance Hub | OK `ComplianceManagementHub.tsx` | Partial (embedded in page) | Minor gap |

### Gaps
1. Partial **Default UK Employment Template** - Seeder exists but needs full legacy template data

---

## 4. Onboarding - Complete

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Step 1: Identity | `Step1_Identity.tsx` | OK `identity-step.tsx` |
| Step 2: Job & Compensation | `Step2_Job & Compensation.tsx` | OK `job-step.tsx` |
| Step 3: Assignments | `Step3_Assignments.tsx` | OK `assignments-step.tsx` |
| Step 4: Review & Send | `Step4_Review.tsx` | OK `review-step.tsx` |
| Email collision check | `checkExistingEmployee` | OK `check-existing-onboarding-target.ts` |
| Send invitation | `onboardEmployee` | OK `send-onboarding-invite.ts` |
| Accept invitation flow | In auth flow | OK `complete-onboarding-invite.ts` (links profile + checklist instantiation) |
| Checklist template CRUD | Admin workflows page | OK `ChecklistTemplatesPanel` |
| Checklist instance assign | On accept | OK `complete-onboarding-invite.ts` + wizard submit |
| Checklist progress tracking | `getEmployeeActiveChecklist` | OK `get-active-checklist.ts` |
| Complete onboarding | `completeOnboardingChecklist` | OK `complete-checklist.ts` |

### Critical Issues (from `hr-onboarding-parity.md`)

#### 1. Identity Resolution & Linking (Resolved)
- OK `complete-onboarding-invite.ts` links pre-boarding profiles to the accepting user before contract creation

#### 2. Checklist Instantiation (Resolved)
- OK Acceptance flow now instantiates checklist instances based on the onboarding template

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Onboarding Wizard | OK `OnboardingWizard.tsx` (4 steps) | OK `onboarding-wizard.tsx` | Full parity |
| Invite Panel | Wizard Step 1 | OK `InviteEmployeePanel` + `identity-step.tsx` | Full parity |
| Template Management | OK Admin workflows | OK `/hr/onboarding/page.tsx` | Full parity |
| Active Checklist Card | OK Employee profile | OK `active-checklist-card.tsx` | Embedded in employee profile overview |
| Wizard Route | OK Wizard page | OK `/hr/onboarding/new/page.tsx` | Full parity |

### Modern Improvements (31 Dec 2025)
- OK **4-Step Onboarding Wizard** - Full multi-step wizard with stepper UI (`src/components/ui/stepper.tsx`)
- OK **Identity Step** - Email collision check with async validation
- OK **Job & Compensation Step** - Position, department, salary, manager, start date
- OK **Assignments Step** - Leave type selection, checklist template assignment
- OK **Review Step** - Summary view with edit navigation
- OK **Checklist Progress Use-Cases** - `get-active-checklist.ts`, `update-checklist-items.ts`, `complete-checklist.ts`
- OK **Active Checklist Card** - Interactive component with progress tracking and item toggles
- OK **Server Actions** - `submitOnboardingWizardAction`, `checkEmailExistsAction`, checklist actions
- OK **Invitation Acceptance** - Links pre-boarding profiles and instantiates checklist instances

### Remaining Gaps
1. None identified (verify acceptance flow in production)

---

## 5. Employee Profiles & Directory - Complete

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Employee directory list | `/hr/employees/page.tsx` | OK `src/app/(app)/hr/employees/page.tsx` |
| Employee profile view | `/hr/employees/[id]/page.tsx` | OK `src/app/(app)/hr/employees/[id]/page.tsx` |
| Profile tabs (profile, compliance, leave, checklists, contracts) | Employee detail page | OK (overview, compliance, time off, checklists, contract, development) |
| Search/filter/sort employees | Directory UI | OK server-side filters/sort + pagination (department/manager/date filters) |
| Bulk export | CSV export | OK `src/app/(app)/hr/employees/export/route.ts` |
| Create employee | Onboarding wizard | OK onboarding accept links profile + checklist |
| Update employee (admin) | Profile edit form | OK expanded profile + contract edit flows (address, emergency, compensation, metadata, benefits, working pattern, furlough, termination) |
| Employment contracts/history | Embedded in profile | OK contract summary + history view |
| Eligibility/leave type assignment | Employee eligibility | OK lifecycle actions UI |
| Termination/offboarding | Status updates | OK lifecycle actions UI |
| Manager relationship | In profile | OK surfaced in overview |
| Compliance/leave/checklist summary | Employee detail tabs | OK compliance + leave/time off + active + history checklists |

### Modern Improvements
- OK Directory + detail UI with server-side filters/pagination, export, admin edits, and development summaries
- OK Expanded admin edit flows for profile + contract (address, emergency contact, compensation, metadata, benefits, working pattern, furlough, termination notes)
- OK Contract summary/history + checklist history surfaced in employee detail
- OK Lifecycle actions UI for eligibility/leave assignment, termination/offboarding, compliance assignment
- OK People service + orchestration with cache tags, audit metadata, and tenant scoping (`src/server/services/hr/people`)
- OK SAR export + retention scheduler with admin actions to run/schedule sweeps
- OK Data residency + classification fields persisted on profiles/contracts

### Backend Implementation (Modern)
| Capability | Status | Notes |
|-----------|--------|-------|
| Profile CRUD API | OK | `src/app/api/hr/people/profiles` + `src/server/api-adapters/hr/people/profiles-controller.ts` |
| Contract CRUD API | OK | `src/app/api/hr/people/contracts` + `src/server/api-adapters/hr/people/contracts-controller.ts` |
| Profile + contract cache helpers | OK | `src/server/use-cases/hr/people/*` |
| People orchestration service | OK | `src/server/services/hr/people/people-orchestration.service.ts` |
| SAR/retention jobs | OK | Jobs + worker + admin actions to run/schedule sweeps + SAR export route |

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Employee Directory | OK Full featured | OK `src/app/(app)/hr/employees/page.tsx` | Stats + server-side filters/search/sort/pagination + export |
| Employee Detail/[id] | OK Tabbed interface | OK `src/app/(app)/hr/employees/[id]/page.tsx` | Tabs + admin edit cards + lifecycle actions + contract/checklist history + development summary |
| Employee Summary (Admin Hub) | OK In admin hub | OK `employee-management-hub.tsx` | Stats + recent employees + data operations (retention/SAR) |
| Personal Profile | OK `/hr/profile` | OK `/hr/profile/page.tsx` | Read-only identity card |

### Gaps
1. None identified (core employee profile + directory parity reached)

---

## 6. Admin Hub - Complete

### Legacy Features (old/)
The legacy project had a comprehensive HR Administration Center (`/hr/admin/page.tsx`) with four hub components:

| Hub | File | Status in Modern |
|-----|------|------------------|
| Leave Management Hub | `LeaveManagementHub.tsx` | OK `leave-management-hub.tsx` |
| Absence Management Hub | `AbsenceManagementHub.tsx` | OK `absence-management-hub.tsx` |
| Employee Management Hub | `EmployeeManagementHub.tsx` | OK `employee-management-hub.tsx` |
| Compliance Management Hub | `ComplianceManagementHub.tsx` | Partial `ComplianceReviewQueuePanel` (reused) |

### Modern Implementation (1 Jan 2026)
Fully implemented tabbed admin hub at `/hr/admin/page.tsx` with:

**Architecture:**
- OK Server Components first with minimal client islands
- OK PPR + nested Suspense with skeleton loaders
- OK Typed Server Actions with `useActionState`
- OK Zod validation at form boundaries
- OK SOLID DI pattern with factory functions
- OK Zero-trust tenant scoping throughout

**File Structure:**
```
src/app/(app)/hr/admin/
  page.tsx                    # Main hub with tab routing
  _types/                     # Type contracts
  _schemas/                   # Zod form schemas
  actions/                    # Server actions (leave, absence)
  _components/
    admin-hub-tabs.tsx        # Client tab navigation
    admin-hub-skeletons.tsx   # Loading states
    leave-management-hub.tsx
    leave-approval-form.tsx
    absence-management-hub.tsx
    absence-acknowledge-form.tsx
    employee-management-hub.tsx
```

### Features Implemented
1. OK **Bulk leave approval interface** - Pending requests table with approve/reject
2. OK **Absence acknowledgment queue** - Reported absences with acknowledge/approve
3. OK **Employee directory overview** - Stats cards + recent employees table
4. OK **Compliance review queue** - Reuses existing `ComplianceReviewQueuePanel`
5. OK **Tab-based navigation** - URL-synced tabs with icons
6. OK **Loading skeletons** - Per-hub skeleton loaders for PPR

### Remaining Enhancements (P2/P3)
1. Partial **Leave policy admin hub integration** - Policy management now lives in `/hr/settings`; hub tab + default seeding still pending
2. Partial **Employee bulk operations** - Multi-select actions
3. Partial **Compliance template hub integration** - CRUD now in `/hr/compliance`; admin hub consolidation pending

---

## 7. Performance Reviews

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Performance review entity | `PerformanceReview` type | OK Prisma model |
| Goals tracking | In review | OK `PerformanceGoal` model |
| Record review | Service method | OK `record-review.ts` |
| Update review | Service method | OK `update-performance-review.ts` |
| List reviews | Service method | OK `list-performance-reviews.ts` |

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Performance Dashboard | OK (likely in profile) | OK `/hr/performance/page.tsx` | Full parity |
| Review Details | OK | OK `PerformanceReviewsPanel` | Full parity |
| Stats Card | OK | OK `PerformanceStatsCard` | Full parity |

### Status: Complete

---

## 8. Training & Development

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Training record | `TrainingRecord` type | OK Prisma model |
| Enroll in training | Service method | OK `enroll-training.ts` |
| Complete training | Service method | OK `complete-training.ts` |
| Track certifications | In employee profile | OK `certifications` field |
| Expiry tracking | In training record | OK `expiryDate`/`renewalDate` |

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Training Dashboard | OK (likely basic) | OK `/hr/training/page.tsx` | Full parity |
| Enrollment Form | OK | OK `EnrollTrainingForm` | Full parity |
| Records List | OK | OK `TrainingRecordsPanel` | Full parity |

### Status: Complete

---

## 9. Time Tracking

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Log time entry | `TimeEntry` type | OK `create-time-entry.ts` |
| View timesheet | Service method | OK `list-time-entries.ts` |
| Approve timesheet | Manager action | OK `approve-time-entry.ts` |
| View team timesheet | Manager view | Partial backend only; no manager UI |

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Time Tracking Page | OK (basic) | OK `/hr/time-tracking/page.tsx` | Full parity |

### Status: Near Complete (team view UI missing)

### Gaps
1. Missing **Team Timesheet UI** - Manager/team view not yet implemented

---

## 10. Policies & Acknowledgments

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| Create policy | `hrPolicies` service | OK `/hr/policies` admin create/edit/publish UI |
| List policies | Service method | OK `list-hr-policies.ts` |
| Acknowledge policy | `PolicyAcknowledgment` type | OK `acknowledge-hr-policy.ts` |
| View policy details | Detail page | OK `/hr/policies/[policyId]/page.tsx` |
| Publish policy | Admin action | OK publish workflow + org-wide notifications |

### UI Implementation
| Page | Legacy | Modern | Notes |
|------|--------|--------|-------|
| Policies List | OK `/hr/policies` | OK `/hr/policies/page.tsx` | Full parity |
| Policy Detail | OK `/hr/policies/[policyId]/page.tsx` | OK `/hr/policies/[policyId]/page.tsx` | Full parity |
| Dashboard Summary | OK | OK `PoliciesSummaryCard` | Full parity |

### Status: Complete

### Gaps
1. None identified (admin create/edit/publish workflows and org-wide publish notifications are now in place)

---

## 11. Notifications

### Legacy Features (old/)
| Feature | Implementation | Status in Modern |
|---------|---------------|------------------|
| HR notification entity | `HRNotification` type | OK `HRNotification` Prisma model with full tenant metadata |
| Send notification | `hrNotifications` service | OK `HrNotificationService` via DI pattern |
| Mark as read | `markAsRead` method | OK `markNotificationRead` + `markAllNotificationsRead` |
| Unread count | `getUnreadCount` method | OK `getUnreadCount` in repository + service |
| Notification types | Leave, absence, compliance, etc. | OK 13-type `HRNotificationType` enum |
| List/filter notifications | Service method | OK `listNotifications` with filters (type, priority, unread, date range) |
| Delete notification | Service method | OK `deleteNotification` |

### Modern Architecture (Deep Analysis)

**1. Domain Types (`src/server/types/hr/notifications.ts`)**
- **13 notification types**: `leave-approval`, `leave-rejection`, `document-expiry`, `policy-update`, `performance-review`, `time-entry`, `training-assigned`, `training-due`, `training-completed`, `training-overdue`, `system-announcement`, `compliance-reminder`, `other`
- **4 priority levels**: `low`, `medium`, `high`, `urgent`
- **Rich DTO**: `id`, `orgId`, `userId`, `title`, `message`, `type`, `priority`, `isRead`, `readAt`, `actionUrl`, `actionLabel`, `scheduledFor`, `expiresAt`, `correlationId`, `createdByUserId`, `dataClassification`, `residencyTag`, `metadata`
- **Filters**: `unreadOnly`, `since`, `until`, `types[]`, `priorities[]`, `includeExpired`, `limit`

**2. Repository Layer (`src/server/repositories/prisma/hr/notifications/`)**
- OK **Contract**: `IHRNotificationRepository` with CRUD + unread count
- OK **Prisma Implementation**: `PrismaHRNotificationRepository` extends `BasePrismaRepository`
- OK **Mapper**: Bidirectional Prisma ↔ Domain conversion
- OK **Cache integration**: `invalidateHrNotifications`, `registerHrNotificationTag`
- OK **Tenant assertion**: `assertTenantRecord` + cross-tenant protection

**3. Service Layer (`src/server/services/hr/notifications/`)**
- OK **HrNotificationService**: SOLID DI pattern extending `AbstractHrService`
- OK **ABAC enforcement**: `ensureOrgAccess` with `HR_ACTION`/`HR_RESOURCE` guards
- OK **Operations**: `createNotification`, `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `deleteNotification`
- OK **Service context**: Structured logging via `executeInServiceContext`
- OK **Provider**: `getHrNotificationService()` factory with singleton pattern

**4. Use-Cases (`src/server/use-cases/hr/notifications/`)**
- OK `create-hr-notification.ts` - Create notification use-case
- OK `get-hr-notifications.ts` - List notifications with filters
- OK `mark-hr-notification-read.ts` - Mark single notification read
- OK `mark-all-hr-notifications-read.ts` - Bulk mark read
- OK `delete-hr-notification.ts` - Delete notification
- OK `notification-emitter.ts` - **Shared emitter** wrapper centralizing classification/residency defaults

**5. API Adapters (`src/server/api-adapters/hr/notifications/`)**
- OK `create-hr-notification.ts` - Create + invalidate cache
- OK `get-hr-notifications.ts` - List + register cache tag
- OK `mark-hr-notification-read.ts` - Update + invalidate
- OK `mark-all-hr-notifications-read.ts` - Bulk update + invalidate
- OK `delete-hr-notification.ts` - Delete + invalidate

**6. Server Actions (`src/server/actions/hr/notifications.ts`)**
- OK `emitHrNotificationAction` - Zod-validated action with ABAC guard

**7. Security Guards (`src/server/security/authorization/hr-guards/notifications.ts`)**
- OK `assertNotificationReader` - Read guard
- OK `assertNotificationCreator` - Create guard
- OK `assertReminderManager` - Reminder management guard

**8. Cache Tags (`src/server/lib/cache-tags/hr-notifications.ts`)**
- OK Tenant-scoped cache tag: `hr-notifications:{orgId}:{classification}:{residency}`
- OK `registerHrNotificationTag` / `invalidateHrNotifications`

### Notification Emission Points (Where Notifications Are Created)

| Module | Operation | Notification Type | File |
|--------|-----------|-------------------|------|
| Leave | Approve request | `leave-approval` | `leave-service.notifications.ts` |
| Leave | Reject request | `leave-rejection` | `leave-service.notifications.ts` |
| Leave | Cancel request | `other` | `leave-service.notifications.ts` |
| Training | Enroll | `training-assigned` | `enroll-training.ts` |
| Training | Update (assign) | `training-assigned` | `update-training-record.ts` |
| Training | Complete | `training-completed` | `complete-training.ts` |
| Training | Expiry reminder | `training-due` | `training/reminder.processor.ts` |
| Training | Overdue | `training-overdue` | `training/reminder.processor.ts` |
| Time Tracking | Create entry | `time-entry` | `create-time-entry.ts` |
| Time Tracking | Update entry | `time-entry` | `update-time-entry.ts` |
| Time Tracking | Approve entry | `time-entry` | `approve-time-entry.ts` |
| Compliance | Expiry reminder | `compliance-reminder` | `compliance/reminder.processor.ts` |
| Onboarding | Checklist reminder | `other` | `onboarding-reminder.processor.ts` |

### Background Workers with Notification Integration

| Worker | Queue | Notifications Emitted | Schedule |
|--------|-------|----------------------|----------|
| TrainingReminderWorker | `hr-training-reminder` | `training-due`, `training-overdue` | Cron `0 2 * * *` (02:00 Europe/London) |
| ComplianceReminderWorker | `hr-compliance-reminder` | `compliance-reminder` | Cron `0 1 * * *` (01:00 Europe/London) |
| OnboardingReminderWorker | `hr-onboarding-reminder` | `other` | On-demand |

### Email Delivery Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| ResendNotificationAdapter | OK | `src/server/services/platform/notifications/adapters/resend-notification-adapter.ts` |
| NovuNotificationAdapter | OK | Alternative delivery adapter |
| SenderXEmailProvider | OK | `src/server/services/notifications/providers/senderx-email-provider.ts` |
| NotificationService | OK | Queue-based dispatch via BullMQ |
| NotificationComposerService | OK | Platform-level notification orchestration |

### Email Channel Support
- OK **Resend integration**: `ResendNotificationAdapter` with API key from `RESEND_API_KEY`
- OK **HTML templating**: Inline style generation with CTA buttons
- OK **Correlation tracking**: `X-Correlation-Id` header support
- OK **Fallback handling**: Graceful degradation when API key not configured

### Gaps & Missing Features

| Gap | Priority | Description |
|-----|----------|-------------|
| Real-time updates | P2 | No WebSocket/SSE for live notification delivery |
| Email templates | P2 | Basic inline HTML; no Resend React templates for rich formatting |
| Push notifications | P3 | No mobile push/web push integration |
| Digest/batching | P3 | No daily/weekly digest option for low-priority notifications |
| Notification history | P3 | No admin view of org-wide notification logs |
| Org defaults | P2 | HR notifications do not consult org-level notification defaults |

### Detailed Gap Analysis

**1. ~~Missing Notification Center UI (P1)~~ Completed 1 Jan 2026**
- OK Notification bell icon in app header with unread count badge
- OK Dropdown panel with recent notifications + "View all" link
- OK Full notification page at `/hr/notifications` with filters
- OK Settings UI for user preferences (`/hr/notifications/settings`)
- OK Mark as read, bulk actions, and delete
- OK Server Actions + Client Islands pattern

**2. Missing Real-time Updates (P2)**
- **Problem**: Notifications require page refresh to appear
- **Required**: WebSocket or Server-Sent Events for live updates
- **Approach**: Integrate with existing notification dispatch worker

**3. ~~Missing HR Notification Preferences (P2)~~ Completed 1 Jan 2026**
- OK Settings page for users to toggle notification types/channels implemented

**4. Notification Types Emitters (Progress Update)**
- OK `performance-review` - Emitted on review creation
- OK `policy-update` - Emitted org-wide on publish via policy service notifications
- OK `document-expiry` - Integrated into compliance reminder worker for "COMPLETE" items with expiry
- `system-announcement` - No admin UI to broadcast org-wide announcements

---

## 12. Permission System (RBAC/ABAC)

### Legacy Roles
```typescript
enum HRRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR_ADMIN = 'hr_admin',
  ORG_ADMIN = 'org_admin'
}
```

### Legacy Permissions (56+)
Categories: Profile, Leave, Documents, Policy, Performance, Time, Admin

### Current State (DB-driven RBAC + ABAC baseline)
- Role assignments stored in DB (`membership.roleId`), role definitions in `Role` (permissions JSON + inheritance)
- Built-in role templates seeded per org (`ROLE_TEMPLATES`, `create-organization-with-owner.ts`)
- Role CRUD UI + services available (`/org/roles`, `RoleService`) with audit logging + permission cache invalidation
- Permission resolution service with inheritance + caching (`PermissionResolutionService`)
- ABAC policies stored in DB and seeded per org (`DEFAULT_BOOTSTRAP_POLICIES`)
- ABAC policy editor UI available at `/org/abac`
- Permission resource registry model + repository/service + UI (`/org/permissions`) exist; default seed data still pending
- HR guards still rely on legacy resource keys (`hrAbsence`, etc) while ABAC resources use dot-notation

### Implementation Status (Database-Driven)
- OK Role definitions stored per org with inheritance; templates seeded on org creation
- OK ABAC policies stored in DB with default bootstrap seeding
- OK ABAC policy editor UI at `/org/abac`
- OK Permission resolution service + cache invalidation on role changes
- OK Audit logging for role changes and ABAC policy updates
- Partial Resource/action registry stored in DB (`PermissionResource`) with `/org/permissions` UI; seed data still missing
- Partial Legacy resource key usage in HR guards; dot-notation registry adoption still pending

### Gaps
1. Partial **Registry Seed Data** - Default HR resources/actions now seeded on org creation; validate idempotency and coverage across provisioning paths.
2. Partial **Legacy-to-Dot Notation Mapping** - HR permission profiles now emit dot-notation resources with legacy alias resolution; role templates remain on legacy keys and still need a follow-up migration.
3. Partial **Legacy Permission Coverage Validation** - Verify team-level permissions/back-compat vs legacy set (manager/admin flows, ABAC templates).

### Legacy-to-New Permission Mapping Checklist
Use this checklist to map legacy RBAC permission keys (OrgPermissionMap + role templates) to the DB-driven resource/action registry and ABAC policies. The checklist is surfaced in `/org/permissions` for tracking.

- [ ] **Legacy mapping checklist** - Track migration from legacy permission keys to the registry and ABAC policies.
- [ ] **Role template alignment** - Map legacy role keys (`employee`, `manager`, `hr_admin`, `org_admin`) to seeded templates (`member`, `manager`, `hrAdmin`, `orgAdmin`, `owner`) and confirm inheritance rules (for example, `hrAdmin` inherits `member`).
- [x] **Absences** - `hrAbsence` -> `hr.absence` (read, list, create, update, delete, acknowledge, cancel); `hrAbsenceSettings` -> `hr.absence.settings` (read, update); `hr.absence.attachment` (create, delete).
- [x] **Compliance** - `hrCompliance` -> `hr.compliance.item` (read, list, create, update, delete, review, assign); `hrComplianceTemplate` -> `hr.compliance.template` (read, list, create, update, delete); `hr.compliance.review` (review).
- [x] **Leave** - `hrLeave` -> `hr.leave.request` (read, list, create, update, delete, approve, reject, cancel); `hrLeaveBalance` -> `hr.leave.balance` (read, adjust); `hrLeavePolicy` -> `hr.leave.policy` (read, list, create, update, delete); `hr.leave.type` (configure/manage).
- [x] **Notifications** - `hrNotification` -> `hr.notification` (read, list, create, update, delete); `hr.reminder` (create, update).
- [x] **Onboarding** - `hrOnboarding` -> `hr.onboarding.invite` (read, send), `hr.onboarding.task` (read, list, create, update, complete, delete); `hr.onboarding.checklist` (read, update, complete); `hrChecklistTemplate` -> `hr.checklist.template` (read, list, create, update, delete).
- [x] **People** - `employeeProfile` -> `hr.people.profile` (read, list, create, update, delete); `employmentContract` -> `hr.people.contract` (read, list, create, update, delete).
- [x] **Performance** - `hrPerformance` -> `hr.performance.review` (read, list, create, update, delete); `hrPerformanceGoal` -> `hr.performance.goal` (read, list, create, update, delete); `hr.performance.feedback` (create, update).
- [x] **Policies** - `hrPolicy` -> `hr.policy` (read, list, create, update, delete, publish, unpublish); `hr.policy.acknowledgment` (acknowledge).
- [x] **Settings** - `hrSettings` -> `hr.settings` (read, update); `organization` -> `org.settings` (read, update).
- [x] **Time Tracking** - `hrTimeEntry` -> `hr.time.entry` (read, list, create, update, delete, approve); `hr.time.sheet` (read, list, approve).
- [x] **Training** - `hrTraining` -> `hr.training.record` (read, list, create, update, delete); `hr.training.enrollment` (enroll, complete).
- [ ] **Registry coverage** - Ensure each legacy resource/action has a matching registry entry and is referenced by role permissions and ABAC templates.
- [ ] **Guard compatibility** - Verify `hasPermission()` and guards support legacy keys during migration.
- [ ] **Policy consistency** - Update ABAC templates to reference dot-notation resources.
- [ ] **Back-compat validation** - Run role checks for manager/admin flows to confirm parity.

---

## 13. UI Components & Design System

### Legacy Components
| Component | Purpose | Modern Equivalent |
|-----------|---------|-------------------|
| `HrRoleGuard` | RBAC wrapper | OK Permission checks in pages |
| `LeaveRequestList` | Reusable list | OK Various panel components |

### Modern Design System
- OK `HrPageHeader` - Consistent page headers
- OK `HrCardSkeleton` - Loading states
- OK `HrDataTable` - Data tables
- OK `HrStatusBadge` - Status indicators
- OK `HrNavigation` - Module navigation
- OK `HrPlaceholder` - Placeholder for unimplemented

### Status: Design system well established

---

## Priority Recommendations

### P0 - Critical (Must Fix Before Launch)

1. ~~**Onboarding Identity Resolution**~~ Completed Jan 2026
   - OK `complete-onboarding-invite.ts` links pre-boarding profiles before contract creation

2. ~~**Checklist Instance Creation**~~ Completed Jan 2026
   - OK Acceptance flow instantiates checklist instances from `onboardingTemplateId`

3. ~~**Employee Detail Page**~~ Completed Jan 2026
   - OK `/hr/employees/[id]` with tabs, admin edits, and development summary

### P1 - High Priority (Launch Blockers)

4. ~~**Admin Leave Management Hub**~~ Completed 1 Jan 2026
   - OK Bulk leave approval interface implemented
   - Partial Leave policy management: `/hr/settings` create/update/delete added; admin hub integration still pending

5. ~~**Admin Absence Management Hub**~~ Completed 1 Jan 2026
   - OK Absence acknowledgment queue implemented
   - OK Absence type configuration UI in `/hr/settings` (create/update/activate)

6. **Onboarding Wizard** Completed 31 Dec 2025
   - OK Multi-step wizard UI with stepper
   - OK Job/compensation and assignments steps

7. ~~**Employee Directory**~~ Completed Jan 2026
   - OK `/hr/employees` with stats, filters, search/sort, pagination, and CSV export

8. **RBAC/ABAC Completion**
   - Role templates + CRUD + cache invalidation implemented
   - ABAC policy editor + permission registry UI now in place (`/org/abac`, `/org/permissions`)
   - Remaining: seed default resources/actions and migrate HR guards from legacy keys (`hrAbsence`, etc) to dot-notation registry

### P2 - Medium Priority (Post-Launch)

9. ~~**Checklist Progress Tracking**~~ Completed Jan 2026
   - OK Active checklist card embedded with item updates

10. ~~**Notification Center UI**~~ Completed 1 Jan 2026
    - OK Notification bell + dropdown, `/hr/notifications` page, bulk actions, preferences UI

11. ~~**Policy Management UI**~~ Completed Jan 2026
    - OK Create/edit/publish admin workflows in `/hr/policies`
    - OK Org-wide policy-update notifications on publish

12. **Team Time Tracking View**
    - Manager/team timesheet UI for approving and auditing entries

13. **Permission Coverage Validation**
    - Compare legacy 56+ permissions with new resources/actions
    - Verify team-level permissions and back-compat role checks

### P3 - Nice to Have

14. **Full Admin Hub Consolidation**
15. **Advanced Reporting/Analytics**
16. **Audit Log UI**
17. **Bulk Operations**

---

## Technical Debt & Architecture Notes

### Improvements in Modern Codebase
1. OK **SOLID Architecture** - Repository pattern, dependency injection
2. OK **Type Safety** - Prisma types, Zod validation
3. OK **Caching Strategy** - Tenant-scoped cache with invalidation
4. OK **Multi-tenancy** - Proper orgId scoping throughout
5. OK **UK Compliance** - GDPR fields, data classification
6. OK **Testing** - Unit tests for services

### Areas Needing Attention
1. Partial **Legacy Data Migration** - `metadata.legacyProfile` needs cleanup
2. Partial **API Route Coverage** - Some features backend-only
3. Partial **UI State Management** - Forms could use better state handling
4. Partial **Error Handling** - Inconsistent error display in UI
5. Missing **Absence Type Seed** - No default absence type catalog on org creation
6. Partial **UI Copy/Encoding Cleanup** - Some HR UI strings contain corrupted placeholders

---

## Appendix: File Structure Comparison

### Legacy Structure (`old/`)
```
src/app/(app)/hr/
  layout.tsx
  dashboard/page.tsx
  employees/
    page.tsx
    [id]/page.tsx          # Implemented in modern
  leave/page.tsx
  absences/page.tsx
  compliance/page.tsx
  profile/page.tsx
  admin/
    page.tsx
    LeaveManagementHub.tsx  # Implemented in modern admin hub
    AbsenceManagementHub.tsx # Implemented in modern admin hub
    EmployeeManagementHub.tsx # Implemented in modern admin hub
    ComplianceManagementHub.tsx # Implemented (panel reused)
  onboarding/
    OnboardingWizard.tsx     # Implemented (new wizard flow)
    steps/                   # Implemented (new wizard flow)
```

### Modern Structure (`orgcentral/`)
```
src/app/(app)/hr/
  layout.tsx                   # Complete
  page.tsx                     # Landing/redirect
  dashboard/page.tsx           # Complete
  employees/page.tsx           # Directory with filters/export
  employees/[id]/page.tsx      # Employee detail tabs
  leave/page.tsx               # Complete
  absences/page.tsx            # Complete
  compliance/page.tsx          # Complete
  profile/page.tsx             # Complete
  training/page.tsx            # Complete
  performance/page.tsx         # Complete
  time-tracking/page.tsx       # Complete
  policies/page.tsx            # Complete
  notifications/               # Notification center + preferences
  settings/page.tsx            # Complete
  admin/                       # Full admin hub (1 Jan 2026)
    page.tsx                   # Tabbed hub page
    _types/                    # Type contracts
    _schemas/                  # Zod schemas
    actions/                   # Server actions
    _components/               # Hub components
  onboarding/                  # Full wizard (31 Dec 2025)
    page.tsx                   # Templates + invites
    new/page.tsx               # 4-step wizard
  _components/                 # Design system
```

---

*Document generated: 31 December 2025*
*Last updated: 2 January 2026 - HR module gap refresh (RBAC/ABAC, compliance templates, policies, time tracking, leave types) + org settings enforcement notes*
*Next review: After RBAC/ABAC migration and admin configuration UIs are complete*
