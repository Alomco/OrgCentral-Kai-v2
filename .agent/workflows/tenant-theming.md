---
description: How to customize organization theme colors (tenant theming)
---

# Tenant Theme System

OrgCentral supports per-organization theming with colorful, futuristic presets.

## Architecture Overview

1. **Theme Presets** (`src/server/theme/theme-presets.ts`)
   - 6 built-in futuristic color schemes
   - Each preset defines complete HSL color tokens
   - Presets: Cyberpunk Purple, Ocean Depths, Sunset Blaze, Forest Emerald, Neon Electric, Royal Velvet

2. **Theme Tokens** (`src/server/theme/tokens.ts`)
   - Defines all CSS variable keys
   - Type-safe HSL value format: "H S% L%"

3. **Theme Resolution** (`src/server/theme/get-tenant-theme.ts`)
   - Resolves theme per organization
   - Supports preset selection + custom color overrides
   - Cached for performance

4. **Theme Registry** (`src/components/theme/tenant-theme-registry.tsx`)
   - Server Component that injects CSS variables
   - Applied in layouts for tenant-specific theming

## Admin Theme Management

// turbo
1. Navigate to `/admin/theme` as a global admin

2. Select a preset from the grid of options

3. Optionally add custom color overrides (HSL format)

4. Click "Apply Theme" to save

## Using Theme-Aware Components

### HR Design System Components

```tsx
import {
    HrGlassCard,
    HrGradientHeader,
    HrStatusIndicator,
    HrGradientButton,
    HrStatCard,
} from '@/app/(app)/hr/_components';

// Glass card with automatic theme colors
<HrGlassCard interactive glow>
    <p>Content here</p>
</HrGlassCard>

// Gradient header with tenant colors
<HrGradientHeader
    title="Dashboard"
    description="Overview of your metrics"
    icon={<ChartIcon />}
/>

// Theme-aware status indicator
<HrStatusIndicator status="success" label="Active" glow />
```

### CSS Utility Classes

```html
<!-- Theme-aware text gradient -->
<h1 class="text-gradient-theme">Beautiful Title</h1>

<!-- Theme-aware glow -->
<div class="glow-theme">Glowing box</div>

<!-- Theme-aware gradient background -->
<div class="bg-gradient-theme">Subtle gradient</div>
<div class="bg-gradient-theme-solid">Solid gradient</div>
```

## Adding a New Theme Preset

1. Open `src/server/theme/theme-presets.ts`

2. Create a new preset object:
```typescript
const myTheme: ThemePreset = {
    id: 'my-theme',
    name: 'My Theme',
    description: 'Description here',
    emoji: '🎨',
    tokens: {
        ...baseTokens,
        'primary': '200 80% 50%' as HslValue,
        // ... all other tokens
    },
};
```

3. Add to `themePresets` record

4. The preset will automatically appear in admin UI

## Database Integration (TODO)

Currently using mock storage. To persist themes:

1. Store in `Organization.settings` JSON field:
```typescript
{
    theme: {
        presetId: 'ocean-depths',
        customOverrides: {
            primary: '200 90% 45%'
        }
    }
}
```

2. Update `get-tenant-theme.ts` to read from database

3. Use `revalidateTag` to clear cache on updates
