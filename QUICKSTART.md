# 🚀 Quick Start Guide - Multi-Tenant Theme System

## 1. Seed the Database with Demo Themes

```bash
pnpm tsx prisma/scripts/seed-tenant-themes.ts
```

**Output:**
```
🎨 Starting tenant theme seed...

📦 Available theme presets (11):
   🔮 Cyberpunk Purple - Vibrant purple and pink with neon accents
   🌊 Ocean Depths - Deep blues and cyan with aquatic vibes
   🌅 Sunset Blaze - Warm oranges and fiery reds
   ... (and 8 more)

✨ Theme seed complete!
```

This creates 11 demo organizations, each with a unique theme.

## 2. Start the Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000/admin/dashboard` to see the redesigned dashboard!

## 3. Test Theme Switching

The app already loads themes based on the current organization (`x-org-id` header).

Switch organizations in your app to see different themes instantly! Each org has its own unique color palette.

## 4. Use Components in Your Pages

### Example 1: Stats Dashboard

```tsx
import {
    ThemeCard,
    ThemeGrid,
    GradientAccent,
    GradientOrb,
    Container,
} from '@/components/theme';
import { Users, TrendingUp } from 'lucide-react';

export default function StatsPage() {
    return (
        <Container spacing="lg" maxWidth="screen" className="relative">
            <GradientOrb position="top-right" color="primary" />
            
            <ThemeGrid cols={3} gap="lg">
                <ThemeCard variant="glass" hover="lift">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">Total Users</p>
                            <h3 className="text-3xl font-bold">2,543</h3>
                        </div>
                        <GradientAccent variant="primary" rounded="lg" className="p-3">
                            <Users className="h-5 w-5 text-white" />
                        </GradientAccent>
                    </div>
                </ThemeCard>
            </ThemeGrid>
        </Container>
    );
}
```

### Example 2: Action Cards

```tsx
import {
    ThemeCard,
    ThemeCardHeader,
    ThemeCardTitle,
    ThemeCardDescription,
    ThemeCardContent,
    ThemeButton,
} from '@/components/theme';

export default function ActionsPage() {
    return (
        <ThemeCard variant="gradient" padding="lg">
            <ThemeCardHeader>
                <ThemeCardTitle gradient>Quick Actions</ThemeCardTitle>
                <ThemeCardDescription>
                    Perform common tasks
                </ThemeCardDescription>
            </ThemeCardHeader>
            <ThemeCardContent>
                <ThemeButton variant="neon" animation="shimmer">
                    Create New
                </ThemeButton>
            </ThemeCardContent>
        </ThemeCard>
    );
}
```

### Example 3: Glass Morphism Layout

```tsx
import { GlassSurface, ThemeFlex, ThemeBadge } from '@/components/theme';

export default function Header() {
    return (
        <GlassSurface intensity="strong" rounded="xl" className="p-4">
            <ThemeFlex justify="between" align="center">
                <h1>Dashboard</h1>
                <ThemeBadge variant="glow">
                    🎯 Pro
                </ThemeBadge>
            </ThemeFlex>
        </GlassSurface>
    );
}
```

## 5. Customize a Theme for Your Organization

### Update via Branding Page

Navigate to `/org/branding` and update:
- Primary Color
- Secondary Color
- Accent Color

**Or** update via API/database:

```typescript
await prisma.organization.update({
    where: { id: 'your-org-id' },
    data: {
        settings: {
            theme: {
                presetId: 'ocean-depths',  // Choose from 11 presets
                customOverrides: {
                    // Optional: Override specific tokens
                    primary: '200 98% 39%',
                    accent: '175 80% 40%',
                },
                updatedAt: new Date().toISOString(),
            },
        },
    },
});
```

## 6. Add a New Custom Theme Preset

Edit [src/server/theme/theme-presets.ts](../src/server/theme/theme-presets.ts):

```typescript
const myCustomTheme: ThemePreset = {
    id: 'my-brand',
    name: 'My Brand Colors',
    description: 'Custom brand palette',
    emoji: '🎨',
    tokens: {
        ...baseTokens,  // Inherit destructive colors
        'background': '0 0% 100%' as HslValue,
        'foreground': '222 84% 5%' as HslValue,
        'primary': '220 90% 56%' as HslValue,
        'primary-foreground': '0 0% 100%' as HslValue,
        // ... define all required tokens
    },
};

// Add to exports
export const themePresets: Record<string, ThemePreset> = {
    // ... existing themes
    'my-brand': myCustomTheme,
};
```

## 7. Component Variants Reference

### ThemeButton
```tsx
<ThemeButton variant="default" />      // Standard primary button
<ThemeButton variant="gradient" />     // Gradient background
<ThemeButton variant="glass" />        // Glass morphism
<ThemeButton variant="neon" />         // Neon border glow
<ThemeButton animation="shimmer" />    // Shimmer on hover
<ThemeButton animation="pulse" />      // Pulse glow animation
```

### ThemeCard
```tsx
<ThemeCard variant="default" />        // Standard card
<ThemeCard variant="glass" />          // Frosted glass
<ThemeCard variant="elevated" />       // High shadow
<ThemeCard variant="glow" />           // Primary glow
<ThemeCard variant="neon" />           // Neon borders
<ThemeCard hover="lift" />             // Lift on hover
<ThemeCard hover="glow" />             // Glow on hover
```

### ThemeBadge
```tsx
<ThemeBadge variant="default" />       // Primary badge
<ThemeBadge variant="success" />       // Green badge
<ThemeBadge variant="warning" />       // Yellow badge
<ThemeBadge variant="glow" />          // Glowing badge
<ThemeBadge variant="gradient" />      // Gradient badge
```

## 8. Layout Patterns

### Responsive Grid
```tsx
<ThemeGrid cols={3} gap="lg">
    {/* Responsive: 1 col mobile, 2 tablet, 3 desktop */}
    {items.map(item => <Card key={item.id} {...item} />)}
</ThemeGrid>
```

### Flex Container
```tsx
<ThemeFlex direction="row" justify="between" align="center">
    <Logo />
    <Navigation />
</ThemeFlex>
```

### Section with Background
```tsx
<ThemeSection spacing="xl" background="gradient">
    <Container maxWidth="6xl">
        {/* Content here */}
    </Container>
</ThemeSection>
```

## 9. Decorative Effects

```tsx
// Background gradient orbs
<div className="relative">
    <GradientOrb position="top-left" color="primary" />
    <GradientOrb position="bottom-right" color="accent" />
    {/* Your content */}
</div>

// Shimmer loading
<div className="relative h-20">
    <Shimmer duration="fast" />
</div>

// Glow effects
<div className="relative">
    <GlowEffect color="primary" size="xl" animated />
</div>

// Dividers
<ThemeDivider variant="glow" spacing="lg">
    Section Title
</ThemeDivider>
```

## 10. Server Component Pattern

```tsx
import { getTenantTheme } from '@/server/theme/get-tenant-theme';
import { TenantThemeRegistry } from '@/components/theme';

export default async function Layout({ children }: LayoutProps) {
    // Fetch theme on server
    const theme = await getTenantTheme(orgId);
    
    return (
        <TenantThemeRegistry orgId={orgId}>
            {/* All children inherit theme */}
            {children}
        </TenantThemeRegistry>
    );
}
```

## 11. Next Steps

1. ✅ **Explore the Admin Dashboard** - `/admin/dashboard`
2. ✅ **Try Different Themes** - Switch organizations
3. ✅ **Build New Pages** - Use the component library
4. ✅ **Customize Colors** - Edit branding settings
5. ✅ **Add More Themes** - Create custom presets
6. ✅ **Deploy to Production** - Run migrations & seed

## 📚 Additional Resources

- [Full Documentation](./docs/theme-system-guide.md)
- [Implementation Summary](./IMPLEMENTATION-SUMMARY.md)
- [Component Source](./src/components/theme/)
- [Theme Presets](./src/server/theme/theme-presets.ts)

---

**Need help?** Check the [theme-system-guide.md](./docs/theme-system-guide.md) for detailed API documentation.

**Enjoy building with your new futuristic, colorful UI! 🎨✨🚀**
