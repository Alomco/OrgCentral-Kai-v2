# Lint Error Groups

## 1. Type Safety & `any` Usage (High Priority)
These errors indicate potential runtime safety issues and should be fixed by adding proper types or interfaces.
*   **`@typescript-eslint/no-explicit-any` / `no-unsafe-*`**: 300+ occurrences.
    *   **Key Files:**
        *   `src/server/repositories/prisma/auth/security/prisma-security-event-repository.ts`
        *   `src/server/repositories/prisma/auth/sessions/prisma-user-session-repository.ts`
        *   `src/server/repositories/prisma/hr/leave/prisma-leave-policy-accrual-repository.ts`
        *   `src/server/repositories/prisma/hr/leave/prisma-leave-policy-repository.ts`
        *   `src/server/repositories/prisma/hr/leave/prisma-leave-request-repository.ts`
        *   `src/server/repositories/prisma/hr/people/prisma-employee-profile-repository.ts`
        *   `src/server/repositories/prisma/hr/people/prisma-employment-contract-repository.ts`
        *   `src/server/repositories/prisma/hr/performance/prisma-performance-review-repository.ts`
        *   `src/server/repositories/prisma/hr/training/prisma-training-record-repository.ts`
        *   `src/server/repositories/prisma/org/departments/prisma-department-repository.ts`
        *   `src/server/repositories/prisma/org/integrations/prisma-integration-config-repository.ts`
        *   `src/server/repositories/prisma/org/notifications/prisma-notification-preference-repository.ts`
        *   `src/server/repositories/prisma/org/roles/prisma-role-repository.ts`
        *   `src/server/repositories/prisma/org/users/prisma-user-repository.ts`
        *   `src/server/repositories/prisma/records/audit/prisma-audit-log-repository.ts`
        *   `src/server/repositories/prisma/records/compliance/prisma-compliance-record-repository.ts`
        *   `src/server/repositories/prisma/records/documents/prisma-document-vault-repository.ts`
        *   `src/server/repositories/prisma/records/events/prisma-event-outbox-repository.ts`
        *   `src/server/repositories/prisma/records/privacy/prisma-data-subject-rights-repository.ts`
        *   `src/server/repositories/prisma/records/statutory/prisma-statutory-report-repository.ts`
        *   `src/server/services/auth-service.ts`
        *   `src/server/services/org/modules/user-management.ts`
        *   `src/server/services/org/organization-service-contract.ts`
*   **`@typescript-eslint/no-unsafe-member-access`**: Accessing properties on `any` or `error` types.
    *   **Key Files:** (Same as above, heavily in repositories where `any` return types are accessed).
*   **`@typescript-eslint/no-unsafe-call`**: Calling functions on `any` or `error` types.
    *   **Key Files:** `prisma-security-event-repository.ts`, `prisma-user-session-repository.ts`, `otel-config.ts`.
*   **`@typescript-eslint/no-unsafe-return`**: Returning `any` from typed functions.
    *   **Key Files:** Repositories returning un-typed Prisma results.

## 2. Async & Await Logic (Medium Priority)
These errors might lead to unhandled promises or performance issues.
*   **`@typescript-eslint/require-await`**: Async functions without `await`.
    *   **Key Files:**
        *   `src/server/repositories/prisma/auth/security/prisma-security-event-repository.ts`
        *   `src/server/repositories/prisma/auth/sessions/prisma-user-session-repository.ts`
        *   `src/server/repositories/prisma/hr/people/prisma-employment-contract-repository.ts`
        *   `src/server/repositories/prisma/hr/performance/prisma-performance-review-repository.ts`
        *   `src/server/repositories/prisma/hr/training/prisma-training-record-repository.ts`
        *   `src/server/repositories/prisma/records/compliance/prisma-compliance-record-repository.ts`
        *   `src/server/repositories/prisma/records/privacy/prisma-data-subject-rights-repository.ts`
        *   `src/server/repositories/prisma/records/statutory/prisma-statutory-report-repository.ts`
        *   `src/server/lib/auth.ts`
*   **`no-return-await`**: Redundant `await` on return.
    *   **Key Files:**
        *   `src/server/services/abstract-base-service.ts`
        *   `src/server/services/auth-service.ts`

## 3. Unnecessary & Redundant Code (Low Priority - Cleanup)
These are mostly code style or minor logic cleanups.
*   **`@typescript-eslint/no-unnecessary-condition`**: Checks that are always true/false.
    *   **Key Files:**
        *   `src/server/repositories/prisma/hr/leave/prisma-leave-balance-repository.ts`
        *   `src/server/repositories/prisma/hr/people/prisma-employee-profile-repository.ts`
        *   `src/server/repositories/prisma/org/organization/prisma-organization-repository.ts`
        *   `src/server/repositories/prisma/org/prisma-organization-repository.ts`
        *   `src/server/security/guards.ts`
        *   `src/server/services/hr/leave/modules/leave-balance-coordinator.ts`
*   **`@typescript-eslint/no-unnecessary-type-assertion`**: Casting a type to itself.
    *   **Key Files:**
        *   `src/server/services/membership/membership-service.ts`
        *   `src/server/services/org/organization-profile-service.ts`
        *   `src/server/services/hr/leave/modules/request-fetcher.ts`
        *   `src/server/services/hr/people/people-service.ts`
*   **`@typescript-eslint/prefer-optional-chain`**: Using `&&` instead of `?.`.
    *   **Key Files:** `prisma-leave-balance-repository.ts`, `prisma-leave-request-repository.ts`.
*   **`@typescript-eslint/no-unused-vars`**: Variables defined but not used (especially `prisma`).
    *   **Key Files:** Almost all `prisma-*-repository.ts` files.

## 4. Deprecations & Best Practices (Maintenance)
*   **`@typescript-eslint/no-deprecated`**: Using deprecated APIs.
    *   **Key Files:**
        *   `src/server/logging/structured-logger.ts`
        *   `src/server/telemetry/otel-config.ts`
        *   `src/server/services/hr/people/people-service.schemas.ts`
*   **`unicorn/prevent-abbreviations`**: Variable naming suggestions.
    *   **Key Files:** `structured-logger.ts`, `cache-tags.ts`, `access-control.ts`.
*   **`@typescript-eslint/consistent-type-definitions`**: Prefer `interface` over `type`.
    *   **Key Files:**
        *   `src/server/logging/audit-logger.ts`
        *   `src/server/repositories/mappers/leave-mapper.ts`
        *   `src/server/services/hr/leave/modules/leave-request-input.ts`
        *   `src/server/services/hr/leave/modules/submit-leave-request.ts`

## 5. Prisma & Database Specifics
*   **`@typescript-eslint/no-redundant-type-constituents`**: Issues with union types where one type overrides others.
    *   **Key Files:**
        *   `src/server/lib/cache-tags.ts`
        *   `src/server/repositories/prisma/auth/security/prisma-security-event-repository.ts`
        *   `src/server/repositories/prisma/auth/sessions/prisma-user-session-repository.ts`
        *   `src/server/repositories/prisma/hr/people/prisma-employment-contract-repository.ts`
        *   `src/server/repositories/prisma/hr/performance/prisma-performance-review-repository.ts`
        *   `src/server/repositories/prisma/hr/training/prisma-training-record-repository.ts`
        *   `src/server/repositories/prisma/records/compliance/prisma-compliance-record-repository.ts`
        *   `src/server/repositories/prisma/records/privacy/prisma-data-subject-rights-repository.ts`
        *   `src/server/repositories/prisma/records/statutory/prisma-statutory-report-repository.ts`

## 6. Other
*   **`@typescript-eslint/restrict-template-expressions`**: Invalid template literal types.
    *   **Key Files:** `helpers.ts`, `leave-balance-coordinator.ts`, `role-management.ts`.
*   **`no-console`**: Unexpected console statements.
    *   **Key Files:** `otel-config.ts`.