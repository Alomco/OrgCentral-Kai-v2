---
description: Preview server start, stop, and status check. Local development server management.
---

# /preview - Preview Management

$ARGUMENTS

---

## Task

Manage preview server: start, stop, status check.

### Commands

```
/preview           - Show current status
/preview start     - Start server
/preview stop      - Stop server
/preview restart   - Restart
/preview check     - Health check
```

---

## Usage Examples

### Start Server
```
/preview start

Response:
[START] Starting preview...
   Port: 3000
   Type: Next.js

[OK] Preview ready!
   URL: http://localhost:3000
```

### Status Check
```
/preview

Response:
=== Preview Status ===

[LANG] URL: http://localhost:3000
[FILES] Project: C:/projects/my-app
[TYPE] Type: nextjs
[HEALTH] Health: OK
```

### Port Conflict
```
/preview start

Response:
[WARN] Port 3000 is in use.

Options:
1. Start on port 3001
2. Close app on 3000
3. Specify different port

Which one? (default: 1)
```

---

## Technical

Auto preview uses `auto_preview.py` script:

```bash
python .codex/scripts/auto_preview.py start [port]
python .codex/scripts/auto_preview.py stop
python .codex/scripts/auto_preview.py status
```


