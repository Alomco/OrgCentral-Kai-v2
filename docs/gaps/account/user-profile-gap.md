# Gap: User account profile management

## Legacy reference (old project)
- old/src/app/(app)/profile/page.tsx

## New project status (orgcentral)
- /profile route exists but is currently disabled (`notFound()`), so no account profile UI is exposed
- Existing /hr/profile is employee profile, not account settings

## Impact
- Users cannot update display name, phone, or avatar in the new UI.

## TODO
- [ ] Define profile fields and storage (PII classification, org/user scoping).
- [ ] Add profile update controller with Zod validation, audit logging, and change history.
- [ ] Implement avatar upload pipeline with file type/size validation and secure storage.
- [ ] Build profile UI (Server Component + useActionState) for edit/update and avatar preview.
- [ ] Add tests for validation, upload, and access control.
