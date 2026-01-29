# Gap: Theme accessibility and SSOT risks

## SSOT gaps (new project only)

### Theme sources are fragmented
Evidence:
- orgcentral/src/app/globals.css
- orgcentral/src/components/theme/theme-provider.tsx
- orgcentral/src/components/theme/ui-style-provider.tsx
- orgcentral/src/server/theme/theme-presets.ts
Gap: Theme tokens are defined across multiple sources and are overridden at runtime, while several UI surfaces use fixed colors. This breaks a single source of truth for theme decisions.

### App shell and dashboards bypass theme tokens
Evidence:
- orgcentral/src/components/layout/app-header.module.css
- orgcentral/src/components/layout/app-sidebar.module.css
- orgcentral/src/app/(app)/dashboard/page.tsx
- orgcentral/src/app/(app)/dashboard/_components/dashboard-hero.tsx
Gap: Core surfaces override tokenized theming, so theme presets and UI styles are not authoritative for the most visible screens.

### Auth theme toggle is isolated from tenant theming
Evidence:
- orgcentral/src/components/landing/components/ThemeToggle.tsx
- orgcentral/src/components/auth/AuthLayout.tsx
Gap: Auth pages use a separate theme toggle and fixed palettes, so tenant theme choices are not a single source of truth across the product.
Status: Design-approved (2026-01-19). Auth pages are intentionally styled and should remain unchanged.

## WCAG 2.2 AA risks (new project only)

### Contrast risk from fixed palettes and translucent overlays
Evidence:
- orgcentral/src/components/layout/user-nav.tsx
- orgcentral/src/components/auth/AuthLayout.tsx
- orgcentral/src/components/auth/AdminBootstrapForm.tsx
- orgcentral/src/app/(app)/dashboard/_components/dashboard-widget-card.tsx
Gap: Hard-coded text and background colors combined with translucency can fail minimum contrast once tenant themes change or dark mode is enabled.

### Target size risk for icon-only controls
Evidence:
- orgcentral/src/components/layout/app-header.tsx
- orgcentral/src/components/notifications/notification-bell.tsx
- orgcentral/src/app/(app)/hr/absence/_components/absence-calendar.tsx
Gap: Several icon-only buttons are sized below 44px. This is a potential failure of WCAG 2.2 AA target size guidance for touch users.

## Accessibility gaps (new project only)

### Color-only priority and status cues
Evidence:
- orgcentral/src/components/notifications/notification-item.tsx
- orgcentral/src/app/(app)/hr/absence/_components/absence-calendar.tsx
Gap: Priority and status are indicated with color-only stripes or dots without a text alternative, which is not accessible to color-blind users.

### Missing accessible labels for calendar navigation
Evidence:
- orgcentral/src/app/(app)/hr/absence/_components/absence-calendar.tsx
Gap: Previous and next month buttons are icon-only without aria-label text, so screen readers do not announce their purpose.

### Hover-only actions in notification items
Evidence:
- orgcentral/src/components/notifications/notification-item.tsx
Gap: Action buttons are hidden until hover, which can make them undiscoverable for keyboard users and screen reader users.

### Calendar day cells lack full accessible context
Evidence:
- orgcentral/src/app/(app)/hr/absence/_components/absence-calendar.tsx
Gap: Day buttons only announce the day number and do not describe month, year, or absence counts, limiting screen reader usability.

### Missing comprehensive accessibility compliance
Evidence:
- Across multiple UI components throughout the application
Gap: The application may lack comprehensive WCAG 2.1/2.2 compliance across all modules and components. Limited evidence of systematic accessibility testing and remediation.

## TODOs
- [x] Define theme token SSOT across globals, theme presets, and UI style presets.
	- docs/theme-token-ssot.md
- [x] Analyze app shell and dashboard surfaces to remove fixed palette overrides that bypass theme tokens.
- [x] Auth theming alignment deferred; auth pages are approved as-is and should not be modified.
- [ ] Analyze contrast ratios on fixed palette components to meet WCAG 2.2 AA for text and non-text contrast.
	- In progress: docs/a11y-contrast-audit.md
- [x] Analyze target sizes for icon-only controls and plan adjustments for 44px minimum touch targets.
- [x] Analyze priority and status indicators to add non-color cues and accessible text.
- [x] Analyze calendar navigation and day cells to add aria-labels and full date context.
- [x] Analyze hover-only controls in notification items to ensure keyboard discoverability.
- [ ] Conduct comprehensive accessibility audit across all UI components and modules.
- [ ] Implement systematic accessibility testing in CI/CD pipeline.
- [ ] Add accessibility documentation and guidelines for developers.

## Related gaps
- orgcentral/docs/gaps/ui-ux/theme-ui-switching-gap.md
- orgcentral/docs/gaps/ui-ux/theme-remediation-checklist.md
- orgcentral/docs/gaps/comprehensive-feature-gap-analysis.md
