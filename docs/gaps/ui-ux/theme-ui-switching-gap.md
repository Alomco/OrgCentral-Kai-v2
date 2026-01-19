# Gap: Theme and UI switching consistency

## Current theming system (orgcentral)
- Theme tokens and presets applied via ThemeProvider and data attributes.
  - orgcentral/src/app/layout.tsx
  - orgcentral/src/components/theme/theme-provider.tsx
  - orgcentral/src/app/globals.css
- UI style presets and surface variables applied via UiStyleProvider.
  - orgcentral/src/components/theme/ui-style-provider.tsx
  - orgcentral/src/styles/ui-styles.css
  - orgcentral/src/styles/ui-surfaces.css
- Theme and UI style switcher exposed in app navigation.
  - orgcentral/src/components/theme/theme-switcher.tsx
  - orgcentral/src/components/layout/app-header.tsx

## Critical gaps (new project only)

### App shell ignores tenant theme and UI style tokens
Evidence:
- orgcentral/src/components/layout/app-header.module.css
- orgcentral/src/components/layout/app-sidebar.module.css
Gap: Header and sidebar use hard-coded purple/pink gradients and shadows instead of theme tokens or UI surface variables, so switching theme or UI style does not update these core surfaces.

### Navigation popovers hardcode colors
Evidence:
- orgcentral/src/components/layout/user-nav.tsx
Gap: The user menu popover uses fixed blue/purple gradients, slate text, and blue borders, which conflicts with tenant theme colors and makes popovers visually inconsistent with the rest of the app when theme or style changes.

### Form control focus/hover/validation styling bypasses theme tokens
Evidence:
- orgcentral/src/components/ui/form-fields.tsx
- orgcentral/src/components/auth/AdminBootstrapForm.tsx
Gap: Focus rings, hover states, and error colors are hard-coded to indigo/rose, so component behavior does not adapt to theme tokens or UI style presets.

### Status and priority color system is hard-coded
Evidence:
- orgcentral/src/components/notifications/notification-item.tsx
- orgcentral/src/components/theme/primitives/interactive.tsx
- orgcentral/src/app/(app)/hr/_components/hr-status-badge.tsx
Gap: Priority/status colors use fixed blue/yellow/green/red palettes that do not reflect tenant theme or UI style settings, leading to inconsistent status colors across cards, badges, and alerts.

### Card, body, and surface colors are inconsistent
Evidence:
- orgcentral/src/app/(app)/dashboard/page.tsx
- orgcentral/src/app/(app)/dashboard/_components/dashboard-widget-card.tsx
- orgcentral/src/components/auth/AuthLayout.tsx
Gap: Page backgrounds and card surfaces use fixed blue/indigo/purple or white backgrounds rather than theme tokens, causing mismatched body vs card vs text colors across themed tenants.

### Auth theme toggle is disconnected from tenant theme and UI style presets
Evidence:
- orgcentral/src/components/landing/components/ThemeToggle.tsx
- orgcentral/src/components/auth/AuthLayout.tsx
Gap: Auth screens only toggle light/dark with fixed slate styling and do not reflect tenant theme presets or UI style switching, resulting in a separate, non-tenant theme experience.
Status: Design-approved (2026-01-19). Auth screens intentionally keep their current palette and gradients.

### Dashboard surfaces override theme tokens
Evidence:
- orgcentral/src/app/(app)/dashboard/page.tsx
- orgcentral/src/app/(app)/dashboard/_components/dashboard-hero.tsx
- orgcentral/src/app/(app)/dashboard/_components/dashboard-widget-card.tsx
- orgcentral/src/app/(app)/dashboard/_components/dashboard-widget-skeleton.tsx
Gap: Dashboard backgrounds, hero cards, and widgets hard-code blue/indigo/purple/emerald gradients and text colors, so tenant theme switching does not affect primary dashboard surfaces.

### HR KPI and quick action colors are hard-coded
Evidence:
- orgcentral/src/app/(app)/hr/dashboard/_components/kpi-grid.tsx
- orgcentral/src/app/(app)/hr/dashboard/_components/quick-actions-enhanced.tsx
Gap: KPI cards and quick actions use fixed color classes (blue/amber/rose/etc.), bypassing tenant theme tokens and UI style presets.

### HR status and stat cards do not use theme tokens
Evidence:
- orgcentral/src/app/(app)/hr/_components/hr-status-badge.tsx
- orgcentral/src/app/(app)/hr/_components/hr-design-system/status-indicator.tsx
- orgcentral/src/app/(app)/hr/_components/hr-design-system/stat-card.tsx
Gap: Status badges and stat cards use fixed success/warning/error palettes and non-theme gradients, so status color behavior differs from theme tokens.

### Absence and reports status colors are fixed
Evidence:
- orgcentral/src/app/(app)/hr/absence/_components/absence-detail-dialog.tsx
- orgcentral/src/app/(app)/hr/absence/_components/absence-calendar.tsx
- orgcentral/src/app/(app)/hr/reports/_components/status-breakdown-card.tsx
Gap: Absence statuses and report breakdown bars use fixed colors that do not respond to theme selection.

### Leave request switches use non-theme neutral colors
Evidence:
- orgcentral/src/app/(app)/hr/leave/_components/leave-request-form.dates.tsx
Gap: The half-day switch uses white borders and white thumb styling that does not adapt to theme tokens or UI style presets.

## TODOs
- [x] Analyze how to rework app header and sidebar styling to use theme tokens and UI surface variables instead of fixed gradients.
- [x] Analyze popover and dropdown theming for user navigation to align with theme tokens (foreground, popover, border, accent).
- [x] Analyze form control focus/hover/error color behavior and move to theme token-driven styling.
- [x] Analyze status and priority color mapping to theme-aware tokens for notifications and HR status badges.
- [x] Analyze card/body surface theming so dashboards and auth cards inherit tenant theme and UI style presets.
- [x] Auth theme switching alignment deferred; auth screens are approved as-is and should not be modified.
- [x] Analyze dashboard hero and widget surfaces to remove fixed palette overrides and use theme tokens.
- [x] Analyze HR KPI and quick action cards to use theme-aware accent tokens instead of fixed colors.
- [x] Analyze HR status badges/stat cards to use theme token-driven status colors.
- [x] Analyze absence and reports status colors to align with theme tokens for status and charts.
- [x] Analyze leave request switch styling to use theme token-based neutral colors and focus states.

## Related gaps
- orgcentral/docs/gaps/ui-ux/ui-ux-approach-gap.md
- orgcentral/docs/gaps/ui-ux/theme-accessibility-gap.md
- orgcentral/docs/gaps/ui-ux/theme-remediation-checklist.md
