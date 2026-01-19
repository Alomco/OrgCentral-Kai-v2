# Theme Token SSOT (Single Source of Truth)

## Purpose
Establish a single source of truth for theme tokens so every surface, component, and page uses the same tenant-driven palette and UI style presets.

## SSOT Definition
The theme system is authoritative when all of the following are true:
1. Base tokens live in src/app/globals.css (OKLCH only).
2. Tenant theme presets and overrides are defined in src/server/theme/theme-presets.ts.
3. UI style presets map surfaces in src/styles/ui-styles.css and src/styles/ui-surfaces.css.
4. ThemeProvider and UiStyleProvider apply tokens via data attributes only (no direct colors in components).

## Rules
- Use theme tokens and UI surface tokens only. No hard-coded colors in components.
- Gradients are allowed only for designated UI styles (glass-neon, bold-amoled) and only on container surfaces.
- Clean corporate remains flat (no gradients).
- Auth screens are design-approved and intentionally remain unchanged.
- If dataClassification is not OFFICIAL, treat reads as no-store and avoid caching sensitive palettes.

## Vibe Strategy (UI Style Presets)
Different UI areas can feel distinct by selecting a UI style preset, not by hard-coded colors:
- Calm: lower chroma, softer surfaces, higher blur, lower shadow contrast.
- Crisp: neutral surfaces, tighter borders, higher clarity.
- Bold: higher chroma accents, stronger contrast, focused highlights.

## Implementation Checklist
- Components: no direct colors; rely on bg-*, text-*, border-* tokens.
- Surfaces: use data-ui-surface attributes so ui-surfaces.css controls tone.
- Presets: only adjust tokens in theme-presets.ts or per-tenant overrides.
- Docs: update gap files when SSOT rules change.
