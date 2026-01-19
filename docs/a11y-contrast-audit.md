# Contrast Audit (WCAG 2.2 AA)

Status: In progress (started 2026-01-19)

## Scope
Validate contrast ratios for token pairs used across UI surfaces in light and dark themes.

## Minimum Targets
- Normal text: 4.5:1
- Large text (18pt+ or 14pt bold): 3:1
- UI boundaries and focus indicators: 3:1

## Token Pairs to Verify
- text-foreground on background
- text-foreground on card
- text-muted-foreground on background
- text-muted-foreground on muted
- text-primary-foreground on primary
- text-secondary-foreground on secondary
- text-accent-foreground on accent
- text-destructive-foreground on destructive
- border on background (non-text contrast)
- ring on background (focus indicator contrast)

## Initial Checks (2026-01-19)
- Background vs foreground: pending
- Card vs foreground: pending
- Muted vs muted-foreground: pending
- Primary vs primary-foreground: pending

## Surfaces to Sample
- app shell (header, sidebar, popovers)
- dashboards and cards
- org settings and billing surfaces
- HR dashboards and absence/calendar surfaces
- notifications and badges

## Tools
- WebAIM Contrast Checker (manual validation)
- Material Color Utilities contrast helpers for tonal checks
- Automated audit script: scripts/contrast-audit.ts (uses culori wcagContrast)

## Runbook
1. Install deps if needed.
2. Run: pnpm tsx scripts/contrast-audit.ts
3. Paste results into this doc under "Initial Checks" and link any failures.

## Notes
- Auth screens are design-approved and excluded from token remediation.
- No gradients for app surfaces; contrast must hold on flat token surfaces.
