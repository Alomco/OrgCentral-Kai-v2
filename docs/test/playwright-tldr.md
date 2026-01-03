# Playwright Testing TLDR (Copilot Chrome DevTools MCP)

## Goal
Run Playwright checks through Copilot Chrome DevTools MCP and capture artifacts.

## Prereqs
- App is running on the target base URL.
- Playwright dependencies are installed (`pnpm install`).
- Copilot Chrome DevTools MCP is connected.

## MCP Quick Run
1. Start the app (dev or preview).
2. Open Chrome DevTools and connect Copilot MCP.
3. Ask Copilot to run Playwright:
   - Full suite
   - Single spec file
   - Test name filter (grep)
4. If a test fails, ask Copilot to open the report or fetch artifacts.

## Deliverables
- HTML report: `playwright-report/`
- Test artifacts: `test-results/` (screenshots, videos, traces when enabled)
- Logs captured by the MCP run

## Notes
- Set required env vars before starting the app.
- Use targeted runs for faster iteration (single spec or name filter).
