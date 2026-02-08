---
name: leave-e2e-testing
description: End-to-end testing workflow for any product feature using existing testing and debugging skills.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash

requires-skills:
  - webapp-testing
  - testing-patterns
  - systematic-debugging
  - lint-and-validate
  - nextjs-best-practices
  - powershell-windows
---

# Feature E2E Testing

> Run reliable end-to-end coverage for HR leave workflows using existing skills.

## Purpose

Provide a repeatable, production-ready testing playbook for any feature (HR, finance, org settings, onboarding, offboarding, etc.) while preserving tenant boundaries and compliance requirements.

## When to Use

- Verifying a feature's primary user flow end-to-end.
- Regressions after feature domain changes.
- Production readiness checks for any feature.

## Dependencies (Must Load)

- `webapp-testing` for E2E workflow principles.
- `testing-patterns` for test structure.
- `systematic-debugging` for root-cause analysis.
- `lint-and-validate` for readiness validation.
- `nextjs-best-practices` for App Router runtime checks.
- `powershell-windows` for command execution on Windows.

## Preflight Checklist

1. Confirm tenant scope and authorization guards are enforced (no direct data access).
2. Ensure classification is `OFFICIAL` for cache-eligible flows; otherwise use no-store.
3. Verify feature prerequisites exist for the target user (e.g., policies, roles, balances, configs).
4. Confirm Next.js dev server is running and MCP is available.

## Workflow

### 1) Discover & Map

- Identify feature routes and API endpoints.
- Capture the user role and org context.
- Record expected configuration, policies, and data prerequisites.

### 2) Execute E2E Flow (Headed Chrome)

Test the primary flow in order:

1. Visit the feature entry route and confirm core data renders.
2. Complete the main form/action with valid inputs.
3. Confirm any preview or confirmation step.
4. Submit and verify the result appears in the UI list/detail view.
5. Validate state changes (balances, statuses, counters, etc.).
6. Validate any related subpages or reports.

### 3) Negative & Edge Cases

- Submit without required fields (validation error).
- Submit with invalid date ranges or formats.
- Submit exceeding limits (blocked or warning based on policy override).

### 4) Diagnostics & Fixes

- Use runtime errors from Next.js MCP first.
- If error is unknown, normalize identifier mismatches (userId vs employeeNumber vs profileId).
- Ensure repositories accept correct identifiers and are scoped by org.

### 5) Validate Readiness

Run type-check and lint on changed paths.

## Output Artifacts

- List of routes tested.
- Summary of successful submissions.
- Errors found and fixes applied.
- Verification results for tsc/lint.

## Notes

- Never log PII or secrets.
- Always preserve `orgId`, `dataResidency`, `dataClassification` on mutations.
- Avoid caching when `dataClassification !== 'OFFICIAL'`.
