# Copilot Chat Architecture

> Comprehensive AI Agent Capability Expansion Toolkit

---

## ðŸ“‹ Overview

This Copilot Chat toolkit is a modular system consisting of:

- **20 Specialist Agents + 1 Orchestration Profile** - Role-based AI personas
- **43 Skills** - Domain-specific knowledge modules
- **12 Prompt Commands** - `*.prompt.md` slash-command files
- **11 Workflows** - Reference runbooks

This .github folder is the source of truth for Copilot Chat alignment.

## Must-follow Principles

### VS Code Copilot Compatibility Baseline
- Optimize tools usage and benefits for VS Code Copilot Chat on Windows.
- If any guidance conflicts with Copilot Chat capabilities, prioritize Copilot Chat compatibility. use parallel file patching.
- Store custom agents as `.github/agents/*.agent.md`.
- Keep YAML front matter at the top of every agent file.
- Use PowerShell-compatible command examples for Windows-first workflows.


Start here: [.github/copilot-chat-guide.md](.github/copilot-chat-guide.md)

---

## ðŸ—ï¸ Directory Structure

```plaintext
.github/
â”œâ”€â”€ ARCHITECTURE.md          # This file
â”œâ”€â”€ copilot-instructions.md  # Always-on instructions
â”œâ”€â”€ agents/                  # *.agent.md files (20 specialist + 1 orchestration profile)
â”œâ”€â”€ instructions/             # Optional .instructions.md files
â”œâ”€â”€ prompts/                  # Prompt files (slash commands)
â”œâ”€â”€ skills/                  # 43 Skills
â”œâ”€â”€ workflows/               # 11 reference runbooks
â”œâ”€â”€ rules/                   # Global Rules
â””â”€â”€ scripts/                 # Master Validation Scripts
```

---

## Test Agent Accounts

Use these files for seeded test-agent personas and credentials:

- `.codex/test-accounts/catalog.local.json` (machine-readable, local-only)
- `.codex/test-accounts/README.local.md` (human-readable, local-only)
- `docs/runbooks/test-agent-accounts.md` (usage and verification runbook)

Commands:

- `pnpm seed:test-accounts`
- `pnpm seed:test-accounts:realistic`
- `pnpm seed:test-accounts:realistic:reset`
- `pnpm test-accounts:list`
- `pnpm test-accounts:verify`

Recommended QA order:

1. `pnpm seed:test-accounts:realistic:reset`
2. `pnpm test-accounts:verify`
3. Select personas from `.codex/test-accounts/catalog.local.json` by `state`, `roleKey`, and `organizationSlug`.

---

## ðŸ¤– Agents (20 + 1 profile)

Specialist AI personas for different domains.

| Agent | Focus | Skills Used |
| ----- | ----- | ----------- |
| `orchestrator` | Multi-agent coordination | parallel-agents, behavioral-modes |
| `project-planner` | Discovery, task planning | brainstorming, plan-writing, architecture |
| `frontend-specialist` | Web UI/UX | frontend-design, react-patterns, tailwind-patterns |
| `backend-specialist` | API, business logic | api-patterns, nodejs-best-practices, database-design |
| `database-architect` | Schema, SQL | database-design |
| `mobile-developer` | iOS, Android, RN | mobile-design |
| `game-developer` | Game logic, mechanics | game-development |
| `devops-engineer` | CI/CD, Docker | deployment-procedures, server-management |
| `security-auditor` | Security compliance, information-security-manager-iso27001 | vulnerability-scanner, red-team-tactics |
| `penetration-tester` | Offensive security | red-team-tactics |
| `test-engineer` | Testing strategies | testing-patterns, tdd-workflow, webapp-testing |
| `debugger` | Root cause analysis | systematic-debugging |
| `performance-optimizer` | Speed, Web Vitals | performance-profiling |
| `seo-specialist` | Ranking, visibility | seo-fundamentals, geo-fundamentals |
| `documentation-writer` | Manuals, docs | documentation-templates |
| `product-manager` | Requirements, user stories | plan-writing, brainstorming |
| `product-owner` | Strategy, backlog, MVP | plan-writing, brainstorming |
| `qa-automation-engineer` | E2E testing, CI pipelines | webapp-testing, testing-patterns |
| `code-archaeologist` | Legacy code, refactoring | clean-code, code-review-checklist |
| `explorer-agent` | Codebase analysis | - |

---

## 🧩 Skills (43)

Modular knowledge domains that agents can load on-demand based on task context.

### Frontend & UI

| Skill | Description |
| ----- | ----------- |
| `react-patterns` | React hooks, state, performance |
| `nextjs-best-practices` | App Router, Server Components |
| `tailwind-patterns` | Tailwind CSS v4 utilities |
| `frontend-design` | UI/UX patterns, design systems |
| `motion` | Motion design, transitions, accessibility |
| `vercel-react-best-practices` | React/Next.js performance guidance |

### Backend & API

| Skill | Description |
| ----- | ----------- |
| `api-patterns` | REST, GraphQL, tRPC |
| `nodejs-best-practices` | Node.js async, modules |
| `python-patterns` | Python standards, FastAPI |

### Database

| Skill | Description |
| ----- | ----------- |
| `database-design` | Schema design, optimization |

### Cloud & Infrastructure

| Skill | Description |
| ----- | ----------- |
| `deployment-procedures` | CI/CD, deploy workflows |
| `server-management` | Infrastructure management |

### Testing & Quality

| Skill | Description |
| ----- | ----------- |
| `testing-patterns` | Jest, Vitest, strategies |
| `webapp-testing` | E2E, Playwright |
| `tdd-workflow` | Test-driven development |
| `code-review-checklist` | Code review standards |
| `lint-and-validate` | Linting, validation |
| `leave-e2e-testing` | End-to-end feature testing workflow |

### Security

| Skill | Description |
| ----- | ----------- |
| `vulnerability-scanner` | Security auditing, OWASP |
| `red-team-tactics` | Offensive security |

### Architecture & Planning

| Skill | Description |
| ----- | ----------- |
| `app-builder` | Full-stack app scaffolding |
| `architecture` | System design patterns |
| `plan-writing` | Task planning, breakdown |
| `brainstorming` | Socratic questioning |
| `intelligent-routing` | Automatic skill/agent selection |

### Mobile

| Skill | Description |
| ----- | ----------- |
| `mobile-design` | Mobile UI/UX patterns |

### Game Development

| Skill | Description |
| ----- | ----------- |
| `game-development` | Game logic, mechanics |

### SEO & Growth

| Skill | Description |
| ----- | ----------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |
| `geo-fundamentals` | GenAI optimization |

### Shell/CLI

| Skill | Description |
| ----- | ----------- |
| `bash-linux` | Linux commands, scripting |
| `powershell-windows` | Windows PowerShell |

### Other

| Skill | Description |
| ----- | ----------- |
| `clean-code` | Coding standards (Global) |
| `behavioral-modes` | Agent personas |
| `parallel-agents` | Multi-agent patterns |
| `mcp-builder` | Model Context Protocol |
| `documentation-templates` | Doc formats |
| `i18n-localization` | Internationalization |
| `performance-profiling` | Web Vitals, optimization |
| `systematic-debugging` | Troubleshooting |

---

## 🔄 Prompt Commands (12)

Slash commands are loaded from .github/prompts/*.prompt.md.

| Command | Description |
| ------- | ----------- |
| `/brainstorm` | Socratic discovery |
| `/create` | Create new features |
| `/debug` | Debug issues |
| `/deploy` | Deploy application |
| `/enhance` | Improve existing code |
| `/orchestrate` | Multi-agent coordination |
| `/plan` | Task breakdown |
| `/preview` | Preview changes |
| `/status` | Check project status |
| `/test` | Run tests |
| `/ui-ux-pro-max` | Design with 50 styles |
| `/parallel-agents` | Multi-lens orchestration analysis |

---

## ðŸŽ¯ Skill Loading Protocol

```plaintext
User Request â†’ Skill Description Match â†’ Load SKILL.md
                                            â†“
                                    Read references/
                                            â†“
                                    Read scripts/
```

### Skill Structure

```plaintext
skill-name/
â”œâ”€â”€ SKILL.md           # (Required) Metadata & instructions
â”œâ”€â”€ scripts/           # (Optional) Python/Bash scripts
â”œâ”€â”€ references/        # (Optional) Templates, docs
â””â”€â”€ assets/            # (Optional) Images, logos
```

---

## Scripts (2)

Master validation scripts that orchestrate skill-level scripts.

### Master Scripts

| Script | Purpose | When to Use |
| ------ | ------- | ----------- |
| `checklist.py` | Priority-based validation (Core checks) | Development, pre-commit |
| `verify_all.py` | Comprehensive verification (All checks) | Pre-deployment, releases |

### Usage

```bash
# Quick validation during development
python .github/scripts/checklist.py .

# Full verification before deployment
python .github/scripts/verify_all.py . --url http://localhost:3000
```

### What They Check

**checklist.py** (Core checks):

- Security (vulnerabilities, secrets)
- Code Quality (lint, types)
- Schema Validation
- Test Suite
- UX Audit
- SEO Check

**verify_all.py** (Full suite):

- Everything in checklist.py PLUS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Bundle Analysis
- Mobile Audit
- i18n Check

For details, see [scripts/README.md](scripts/README.md)

---

## ðŸ“Š Statistics

| Metric | Value |
| ------ | ----- |
| **Total Agents** | 20 |
| **Total Skills** | 43 |
| **Prompt Commands** | 12 |
| **Total Workflows** | 11 (reference) |
| **Total Scripts** | 2 (master) + 18 (skill-level) |
| **Coverage** | ~90% web/mobile development |

---

## ðŸ”— Quick Reference

| Need | Agent | Skills |
| ---- | ----- | ------ |
| Web App | `frontend-specialist` | react-patterns, nextjs-best-practices |
| API | `backend-specialist` | api-patterns, nodejs-best-practices |
| Mobile | `mobile-developer` | mobile-design |
| Database | `database-architect` | database-design |
| Security | `security-auditor` | vulnerability-scanner |
| Testing | `test-engineer` | testing-patterns, webapp-testing |
| Debug | `debugger` | systematic-debugging |
| Plan | `project-planner` | brainstorming, plan-writing |



