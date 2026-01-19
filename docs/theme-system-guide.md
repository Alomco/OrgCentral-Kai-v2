# 🎨 Multi-Tenant Theme System

## Overview

A comprehensive, production-ready multi-tenant theme system with 11 professional, futuristic color palettes. Built with Server Components, PPR, cacheLife, and strict TypeScript following SOLID principles.

## ✨ Features

- **11 Vibrant Themes**: Professional color palettes for diverse branding
- **SSR/PPR Support**: Server-side theme rendering with Partial Prerendering
- **Cache Components**: Optimized with `cacheLife` and `cacheTag`
- **Type-Safe**: Strict TypeScript with Zod validation
- **Accessible**: Motion-safe, reduced-motion support, WCAG compliant
- **SOLID Principles**: SRP, OCP, LSP, ISP, DIP throughout
- **<250 LOC**: Every file split for maintainability

## 🎨 Available Themes

| Theme | ID | Emoji | Description |
|-------|---|-------|-------------|
| Cyberpunk Purple | `cyberpunk-purple` | 🔮 | Vibrant purple and pink with neon accents |
| Ocean Depths | `ocean-depths` | 🌊 | Deep blues and cyan with aquatic vibes |
| Sunset Blaze | `sunset-blaze` | 🌅 | Warm oranges and fiery reds |
| Forest Emerald | `forest-emerald` | 🌿 | Rich greens with natural energy |
| Neon Electric | `neon-electric` | ⚡ | High-energy neon with electric vibes |
| Royal Velvet | `royal-velvet` | 🍇 | Luxurious deep purples with gold accents |
| Inferno Red | `inferno-red` | 🔥 | Bold reds with fiery orange highlights |
| Cherry Blossom | `cherry-blossom` | 🌸 | Soft pinks with spring freshness |
| Galaxy Indigo | `galaxy-indigo` | 🌌 | Deep cosmic indigo with starlight highlights |
| Tangerine Dream | `tangerine-dream` | 🍊 | Vibrant orange with fresh citrus energy |
| Ruby Matrix | `ruby-matrix` | 🎯 | Professional ruby red with digital energy |

## 📁 Architecture

```
src/
├── components/theme/
│   ├── primitives/          # Base components
│   │   ├── surfaces.tsx     # Container, GlassSurface, GradientAccent
│   │   └── interactive.tsx  # ThemeButton, ThemeBadge, ThemeIconButton
│   ├── cards/
│   │   └── theme-card.tsx   # Card components with headers, titles, content
│   ├── layout/
│   │   └── primitives.tsx   # Grid, Flex, Section, Stack layouts
│   ├── decorative/
│   │   └── effects.tsx      # Shimmer, Glow, GradientOrb, Divider
│   ├── tenant-theme-registry.tsx  # SSR theme injection
│   └── index.ts             # Barrel exports
├── server/theme/
│   ├── tokens.ts            # Theme token definitions
│   ├── theme-presets.ts     # 11 professional color palettes
│   └── get-tenant-theme.ts  # Cached theme resolver
└── prisma/scripts/
    └── seed-tenant-themes.ts  # Database seeding script
```

## 🚀 Quick Start

### 1. Seed Demo Themes

```bash
pnpm tsx prisma/scripts/seed-tenant-themes.ts
```

This creates 11 demo organizations with different theme presets.

### 2. Use Theme Components

```tsx
import {
    ThemeCard,
    ThemeButton,
    ThemeGrid,
    GlassSurface,
    GradientAccent,
} from '@/components/theme';

export default function MyPage() {
    return (
        <ThemeGrid cols={3} gap="lg">
            <ThemeCard variant="glass" hover="lift">
                <GradientAccent variant="primary" rounded="lg" className="p-3">
                    <Icon className="h-5 w-5 text-white" />
                </GradientAccent>
                <h3>Card Title</h3>
                <p>Card content...</p>
            </ThemeCard>
        </ThemeGrid>
    );
}
```

### 3. Server Component Theme Loading

```tsx
import { getTenantTheme } from '@/server/theme/get-tenant-theme';
import { TenantThemeRegistry } from '@/components/theme';

export default async function Layout({ children }: { children: ReactNode }) {
    const theme = await getTenantTheme(orgId);
    
    return (
        <TenantThemeRegistry orgId={orgId}>
            {children}
        </TenantThemeRegistry>
    );
}
```

## 🎨 Component Library

### Surfaces

```tsx
// Container with max-width and spacing
<Container spacing="lg" maxWidth="screen" background="default">
    {children}
</Container>

// Glass morphism effect
<GlassSurface intensity="medium" border="subtle" rounded="xl">
    {children}
</GlassSurface>

// Gradient backgrounds
<GradientAccent variant="vibrant" animated rounded="lg">
    {children}
</GradientAccent>
```

### Interactive Components

```tsx
// Theme-aware buttons
<ThemeButton variant="gradient" size="lg" animation="shimmer">
    Click Me
</ThemeButton>

// Badges
<ThemeBadge variant="glow" size="lg">
    New Feature
</ThemeBadge>

// Icon buttons
<ThemeIconButton size="md" variant="neon" aria-label="Settings">
    <Settings />
</ThemeIconButton>
```

### Cards

```tsx
<ThemeCard variant="glass" hover="lift" padding="lg">
    <ThemeCardHeader accent>
        <ThemeCardTitle size="lg" gradient>
            Title
        </ThemeCardTitle>
        <ThemeCardDescription>
            Description text
        </ThemeCardDescription>
    </ThemeCardHeader>
    <ThemeCardContent>
        Content here
    </ThemeCardContent>
    <ThemeCardFooter divided>
        Footer actions
    </ThemeCardFooter>
</ThemeCard>
```

### Layout

```tsx
// Responsive grid
<ThemeGrid cols={4} gap="lg">
    {items.map(item => <Card key={item.id} />)}
</ThemeGrid>

// Flexbox
<ThemeFlex direction="row" justify="between" align="center" gap="md">
    <div>Left</div>
    <div>Right</div>
</ThemeFlex>

// Sections with backgrounds
<ThemeSection spacing="xl" background="gradient">
    {children}
</ThemeSection>

// Stack (vertical/horizontal)
<ThemeStack gap="lg" horizontal={false}>
    {items}
</ThemeStack>
```

### Decorative Effects

```tsx
// Shimmer loading effect
<div className="relative">
    <Shimmer duration="normal" />
</div>

// Glow effects
<GlowEffect color="primary" size="lg" animated />

// Gradient orbs (background decoration)
<GradientOrb position="top-right" color="multi" />

// Dividers
<ThemeDivider variant="glow" spacing="lg">
    Section Title
</ThemeDivider>
```

## 🔧 Customization

### Add New Theme Preset

Edit `src/server/theme/theme-presets.ts`:

```typescript
const myTheme: ThemePreset = {
    id: 'my-theme',
    name: 'My Custom Theme',
    description: 'Description here',
    emoji: '🎨',
    tokens: {
        'background': '0 0% 100%' as HslValue,
        'foreground': '222 84% 5%' as HslValue,
        // ... all other tokens
    },
};

export const themePresets: Record<string, ThemePreset> = {
    // ... existing themes
    'my-theme': myTheme,
};
```

### Override Theme Tokens Per Organization

```typescript
// In your settings form
await updateOrgBranding({
    theme: {
        presetId: 'cyberpunk-purple',
        customOverrides: {
            primary: '280 100% 60%',
            accent: '330 81% 60%',
        },
    },
});
```

## 🎯 Best Practices

### Theme Token SSOT
See docs/theme-token-ssot.md for the single source of truth rules and UI style preset guidance.

### 1. Server Components First

```tsx
// ✅ Good - Server Component
export default async function Page() {
    const theme = await getTenantTheme(orgId);
    return <ThemeCard>Content</ThemeCard>;
}

// ❌ Avoid - Unnecessary client component
'use client';
export default function Page() {
    // ...
}
```

### 2. Use Suspense Boundaries

```tsx
<Suspense fallback={<Skeleton />}>
    <AsyncComponent />
</Suspense>
```

### 3. Cache Components

```tsx
async function ExpensiveThemeQuery() {
    'use cache';
    cacheLife('hours');
    cacheTag('org-theme', orgId);
    
    return await db.query();
}
```

### 4. Motion Safety

```tsx
// Components auto-handle prefers-reduced-motion
<GradientOrb /> // Has motion-safe: and motion-reduce: classes
```

### 5. TypeScript Strictness

```typescript
// ✅ Typed props
interface Props {
    variant: 'primary' | 'accent';  // No 'any' or 'unknown'
}

// ✅ Zod validation at boundaries
const schema = z.object({
    presetId: z.string().min(1),
});
```

## 📊 Performance

- **SSR**: Themes loaded server-side, zero client JS
- **Caching**: `cacheLife('hours')` with cache tags
- **CSS Variables**: Runtime theme switching without re-render
- **PPR**: Partial prerendering for static + dynamic content
- **Code Splitting**: <250 LOC files, tree-shakeable exports

## 🔒 Security

- **Tenant Isolation**: Theme data scoped by `orgId`
- **Zod Validation**: All inputs validated
- **SQL Injection**: Prisma ORM protection
- **XSS**: React auto-escaping

## 📝 Database Schema

Themes stored in `Organization.settings.theme` JSONB field:

```typescript
interface OrgThemeSettings {
    presetId?: string;              // 'cyberpunk-purple' | 'ocean-depths' | ...
    customOverrides?: Partial<ThemeTokenMap>;
    updatedAt?: Date;
}
```

## 🧪 Testing

```typescript
// Test theme resolution
const theme = await getTenantTheme('demo-corp');
expect(theme.presetId).toBe('cyberpunk-purple');

// Test component variants
render(<ThemeButton variant="gradient" />);
expect(screen.getByRole('button')).toHaveClass('bg-gradient-to-br');
```

## 🚢 Deployment

1. Run migrations: `pnpm prisma migrate deploy`
2. Seed themes: `pnpm tsx prisma/scripts/seed-tenant-themes.ts`
3. Build: `pnpm build`
4. Deploy: `pnpm start`

## 📚 Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com)
- [Class Variance Authority](https://cva.style)
- [Next.js PPR](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## 🤝 Contributing

1. Keep files <250 LOC
2. Follow SOLID principles
3. Add TypeScript types (no `any` or `unknown`)
4. Use Zod for validation
5. Server Components by default
6. Test accessibility (motion-safe, WCAG)

---

Built with ❤️ using Next.js 16, React 19, TypeScript, Tailwind v4, and Prisma.
