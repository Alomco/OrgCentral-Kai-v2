# Antigravity Skills

> Guide for creating and using skills in Antigravity Kit.

---

## Overview

Base models are general-purpose. They do not automatically know your project rules, templates, and workflows.
Skills solve this with progressive loading:

1. Keep domain knowledge in a skill folder.
2. Load only the skill metadata first.
3. Load detailed files only when needed.

This keeps context focused and reduces noise.

---

## Scope and Paths

Workspace-local skills live here:

`<workspace-root>/.codex/skills/`

Each skill is a directory:

```text
my-skill/
|-- SKILL.md        # Required metadata + instructions
|-- scripts/        # Optional runtime helpers
|-- references/     # Optional docs/templates/checklists
`-- assets/         # Optional static assets
```

---

## Example 1: Instruction-only Skill

Create a new skill folder:

```bash
mkdir -p .codex/skills/code-review
```

Create `.codex/skills/code-review/SKILL.md`:

```markdown
---
name: code-review
description: Reviews code changes for bugs, style issues, and maintainability risks.
---

# Code Review Skill

When reviewing code:
1. Check correctness and edge cases.
2. Validate error handling and security boundaries.
3. Check readability, naming, and coupling.
4. Report concrete issues and suggested fixes.
```

Use it with prompts like:

`Review src/server/auth.ts for bugs and security risks.`

---

## Example 2: Skill with a Template File

Create the folder:

```bash
mkdir -p .codex/skills/license-header-adder/resources
```

Create `.codex/skills/license-header-adder/resources/HEADER.txt`:

```text
/*
 * Copyright (c) 2026 YOUR_COMPANY_NAME LLC.
 * All rights reserved.
 */
```

Create `.codex/skills/license-header-adder/SKILL.md`:

```markdown
---
name: license-header-adder
description: Adds the standard license header to new source files.
---

# License Header Adder

Instructions:
1. Read `resources/HEADER.txt`.
2. Prepend it to new source files.
3. Adapt comment syntax for each language.
```

---

## Loading Behavior

Expected loading flow:

1. Match user request to a skill description.
2. Read `SKILL.md`.
3. Load only referenced files needed for the task.
4. Execute optional scripts when useful.

---

## Best Practices

1. Keep one responsibility per skill.
2. Keep `SKILL.md` concise and action-oriented.
3. Put heavy details in `references/`, not frontmatter.
4. Prefer reusable scripts in `scripts/` over repeated prompt text.
5. Use stable relative paths inside the skill folder.

---

## Quick Checklist

- `SKILL.md` exists.
- `name` and `description` are clear.
- Referenced files actually exist.
- Optional scripts run without manual patching.
- Instructions are deterministic and easy to audit.
