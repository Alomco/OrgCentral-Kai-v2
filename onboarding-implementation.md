# Onboarding Enhancements Implementation

## Goal
Implement IT provisioning, mentor assignment, success metrics/feedback, configurable workflows, email sequences, document templates, and offboarding parity.

## Tasks
- [ ] Add core data models and types (mentor assignments, provisioning tasks, metrics, workflow templates, email sequences, document templates) → Verify: Prisma schema updates + type exports compile.
- [ ] Implement repositories + use-cases + validators for new models (CRUD + onboarding hooks) → Verify: server builds, no type errors.
- [ ] Wire onboarding/offboarding flows to create mentor assignments, provisioning tasks, workflows, sequences, and docs → Verify: accept invite + start offboarding triggers expected records.
- [ ] Add API adapters/routes for new features + offboarding parity endpoints → Verify: routes return expected payloads with auth checks.
- [ ] Add UI panels and wizard fields (mentor, workflow, email sequence, docs, metrics) → Verify: onboarding UI renders and submits with new fields.
- [ ] Add background processing for email sequence deliveries → Verify: worker processes due deliveries in dry-run.
- [ ] Update cache tags, guards, and audit logging for compliance → Verify: no-cache for sensitive data, audit events recorded.

## Done When
- [ ] All roadmap features available in UI and API with tenant-scoped data and audit logging.
