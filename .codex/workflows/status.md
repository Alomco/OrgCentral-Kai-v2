---
description: Display agent and project status. Progress tracking and status board.
---

# /status - Show Status

$ARGUMENTS

---

## Task

Show current project and agent status.

### What It Shows

1. **Project Info**
   - Project name and path
   - Tech stack
   - Current features

2. **Agent Status Board**
   - Which agents are running
   - Which tasks are completed
   - Pending work

3. **File Statistics**
   - Files created count
   - Files modified count

4. **Preview Status**
   - Is server running
   - URL
   - Health check

---

## Example Output

```
=== Project Status ===

[FILES] Project: my-ecommerce
[PATH] Path: C:/projects/my-ecommerce
[TYPE] Type: nextjs-ecommerce
[STATS] Status: active

[STACK] Tech Stack:
   Framework: next.js
   Database: postgresql
   Auth: clerk
   Payment: stripe

[OK] Features (5):
   - product-listing
   - cart
   - checkout
   - user-auth
   - order-history

[PENDING] Pending (2):
   - admin-panel
   - email-notifications

 Files: 73 created, 12 modified

=== Agent Status ===

[OK] database-architect -> Completed
[OK] backend-specialist -> Completed
[RUN] frontend-specialist -> Dashboard components (60%)
[PENDING] test-engineer -> Waiting

=== Preview ===

[LANG] URL: http://localhost:3000
[HEALTH] Health: OK
```

---

## Technical

Status uses these scripts:
- `python .codex/scripts/session_manager.py status`
- `python .codex/scripts/auto_preview.py status`

