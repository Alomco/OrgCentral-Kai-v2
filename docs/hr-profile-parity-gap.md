# HR Profile Parity Gap Analysis

**Date:** January 2, 2026
**Legacy:** `old/src/app/(app)/hr/profile`
**Target:** `orgcentral/src/app/(app)/hr/profile`

This document outlines the feature and data gaps identified when comparing the legacy HR Profile page to the new `orgcentral` implementation.

## 1. Functional Gaps (Critical)

| Feature | Legacy App | OrgCentral (New) | Status |
| :--- | :--- | :--- | :--- |
| **Edit Profile** | ✅ Users can edit phone, address, emergency contact. | ❌ **Read-Only**. No edit forms. | **Missing** |
| **Avatar Upload** | ✅ Users can upload/change profile picture. | ❌ No avatar upload or display. | **Missing** |

## 2. Data Gaps (Missing Information)

The following data fields are present in the Legacy UI but missing from the New UI, even though the backend DTO (`EmployeeProfileDTO`) supports them:

*   **Address Details:** Street, City, State, Postal Code, Country.
*   **Emergency Contact:** Name, Phone, Relationship.
*   **Employment Start Date:** Legacy shows actual "Start Date". New app shows record "Created At".
*   **Detailed Roles:** Legacy lists specific permissions. New app only shows the high-level "Role Key".

## 3. Architectural Differences

*   **Rendering:** Legacy is Client-Side (`useEffect`). New is Server-Side (`Suspense` + `use cache`).
*   **Performance:** New app is significantly faster due to server-side fetching, but lacks the interactivity of the legacy app.

## 4. Recommendations for Parity

1.  **Implement Edit Mode:** Convert the read-only `IdentityCard` into a form (or add an "Edit" button that opens a Sheet/Dialog) using `useOptimistic` for updates.
2.  **Add Avatar Component:** Integrate the `Avatar` component with a file upload action.
3.  **Expand Data Display:** Add sections for "Address" and "Emergency Contact" to the profile page.
4.  **Fix Date Display:** Ensure the API returns `employmentStartDate` and display it instead of `createdAt`.
