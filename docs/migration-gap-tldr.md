# Migration Gap Analysis: TL;DR Summary
**Date:** Friday, January 2, 2026
**Project:** OrgCentral Migration (from Legacy Firebase)

## 1. Overall Status
The `orgcentral` project is architecturally superior and more feature-rich than the `old` system. Most "missing" features are actually present in the **Service Layer** but lack a completed **User Interface**.

## 2. Identified Gaps

### Module: Org (Organization) - [HIGH PRIORITY]
*   **Gap:** Missing **Location Management UI**. The `Location` model exists in Prisma, but there is no screen to Add/Edit/Delete offices or sites.
*   **Legacy Parity:** `old` had an "Additional Locations" array editor in the Company Profile.
*   **Recommendation:** Create `(app)/org/locations` page and port the form logic from the legacy project.

### Module: HR (Human Resources) - [LOW PRIORITY]
*   **Gap:** No significant functional gaps found.
*   **Note:** Business logic has been successfully moved from client-side Firebase hooks to the `HrPeopleService` layer.

### Module: Platform (System) - [LOW PRIORITY]
*   **Gap:** **Onboarding Legacy Users**. Since `old` lacked a formal Subscription/Billing model, a strategy is needed to map legacy users to the new Stripe-integrated "Plans".
*   **Note:** Billing infrastructure is 100% new and complete in `orgcentral`.

### Module: Communication (Cross-Cutting)
*   **Gap:** **Company-Wide Announcements**. The current `HRNotificationService` is optimized for event-driven alerts (e.g., "Leave Approved").
*   **Recommendation:** Add a `BROADCAST` topic to the notification system to allow admins to send generic company announcements.

## 3. Architecture Wins (No Gap)
*   **Multi-Tenancy:** Properly isolated via `orgId` and Postgres schemas.
*   **Compliance:** UK-specific fields (GDPR, NI, Data Residency) are built-in.
*   **Performance:** Move to RSC (React Server Components) eliminates legacy loading waterfalls.
