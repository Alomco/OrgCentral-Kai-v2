/**
 * 🎨 Theme Testing Page
 * 
 * Visual test page for all 11 theme presets.
 * Tests typography, contrast, and component visibility.
 */

import { getPresetOptions } from '@/server/theme/theme-presets';
import {
    ThemeCard,
    ThemeCardHeader,
    ThemeCardTitle,
    ThemeCardDescription,
    ThemeCardContent,
    ThemeButton,
    ThemeBadge,
    ThemeGrid,
    GradientAccent,
    ThemeSwitcher,
} from '@/components/theme';
import { Users, TrendingUp, Shield } from 'lucide-react';

export default function ThemeTestPage() {
    const themes = getPresetOptions();

    return (
        <div className="min-h-screen p-8 space-y-12">
            <header className="text-center space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex-1" />
                    <h1 className="flex-1 text-5xl font-bold bg-linear-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                        Theme Testing Gallery
                    </h1>
                    <div className="flex-1 flex justify-end">
                        <ThemeSwitcher />
                    </div>
                </div>
                <p className="text-lg text-muted-foreground">
                    Visual test for all {themes.length} theme presets
                </p>
            </header>

            <div className="space-y-16">
                {themes.map((theme) => (
                    <section key={theme.id} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{theme.emoji}</span>
                            <div>
                                <h2 className="text-3xl font-bold text-foreground">{theme.name}</h2>
                                <p className="text-muted-foreground">{theme.description}</p>
                                <code className="text-xs text-muted-foreground font-mono">{theme.id}</code>
                            </div>
                        </div>

                        {/* Typography Test */}
                        <ThemeCard variant="glass" padding="lg">
                            <h3 className="text-2xl font-bold text-foreground mb-4">Typography Test</h3>
                            <div className="space-y-3">
                                <p className="text-foreground text-lg">
                                    <strong>Heading/Primary:</strong> The quick brown fox jumps over the lazy dog
                                </p>
                                <p className="text-muted-foreground text-base">
                                    <strong>Muted/Secondary:</strong> The quick brown fox jumps over the lazy dog
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Small text: The quick brown fox jumps over the lazy dog (12px-14px)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Extra small: The quick brown fox jumps over the lazy dog (10px-12px)
                                </p>
                            </div>
                        </ThemeCard>

                        {/* Component Grid */}
                        <ThemeGrid cols={3} gap="md">
                            {/* Stats Card */}
                            <ThemeCard variant="glass" hover="lift">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                        <h3 className="text-3xl font-bold text-foreground">2,543</h3>
                                        <span className="text-sm text-green-500">↑ +12%</span>
                                    </div>
                                    <GradientAccent variant="primary" rounded="lg" className="p-3">
                                        <Users className="h-5 w-5 text-white" />
                                    </GradientAccent>
                                </div>
                            </ThemeCard>

                            {/* Elevated Card */}
                            <ThemeCard variant="elevated" hover="glow">
                                <ThemeCardHeader>
                                    <ThemeCardTitle size="md">Card Title</ThemeCardTitle>
                                    <ThemeCardDescription>
                                        This is a description that should be readable
                                    </ThemeCardDescription>
                                </ThemeCardHeader>
                                <ThemeCardContent>
                                    <p className="text-sm text-foreground">
                                        Body text with proper contrast for readability across all themes.
                                    </p>
                                </ThemeCardContent>
                            </ThemeCard>

                            {/* Gradient Card */}
                            <ThemeCard variant="gradient" padding="md">
                                <div className="space-y-3">
                                    <TrendingUp className="h-6 w-6 text-foreground" />
                                    <h4 className="font-semibold text-foreground">Gradient Background</h4>
                                    <p className="text-sm text-foreground/80">
                                        Testing text visibility on gradient backgrounds
                                    </p>
                                </div>
                            </ThemeCard>
                        </ThemeGrid>

                        {/* Button Variants */}
                        <ThemeCard variant="default" padding="lg">
                            <h3 className="text-xl font-bold text-foreground mb-4">Button Variants</h3>
                            <div className="flex flex-wrap gap-3">
                                <ThemeButton variant="default">Default</ThemeButton>
                                <ThemeButton variant="gradient">Gradient</ThemeButton>
                                <ThemeButton variant="glass">Glass</ThemeButton>
                                <ThemeButton variant="neon">Neon</ThemeButton>
                                <ThemeButton variant="outline">Outline</ThemeButton>
                                <ThemeButton variant="secondary">Secondary</ThemeButton>
                                <ThemeButton variant="ghost">Ghost</ThemeButton>
                                <ThemeButton variant="destructive">Destructive</ThemeButton>
                            </div>
                        </ThemeCard>

                        {/* Badge Variants */}
                        <ThemeCard variant="default" padding="lg">
                            <h3 className="text-xl font-bold text-foreground mb-4">Badge Variants</h3>
                            <div className="flex flex-wrap gap-3">
                                <ThemeBadge variant="default">Default</ThemeBadge>
                                <ThemeBadge variant="success">Success</ThemeBadge>
                                <ThemeBadge variant="warning">Warning</ThemeBadge>
                                <ThemeBadge variant="info">Info</ThemeBadge>
                                <ThemeBadge variant="destructive">Destructive</ThemeBadge>
                                <ThemeBadge variant="gradient">Gradient</ThemeBadge>
                                <ThemeBadge variant="glow">
                                    <Shield className="h-3 w-3" />
                                    Glow
                                </ThemeBadge>
                            </div>
                        </ThemeCard>

                        {/* Contrast Test */}
                        <ThemeCard variant="glow" padding="lg">
                            <h3 className="text-xl font-bold text-foreground mb-4">Contrast & Accessibility Test</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="bg-primary text-primary-foreground p-3 rounded">
                                        Primary bg + Primary fg
                                    </div>
                                    <div className="bg-secondary text-secondary-foreground p-3 rounded">
                                        Secondary bg + Secondary fg
                                    </div>
                                    <div className="bg-accent text-accent-foreground p-3 rounded">
                                        Accent bg + Accent fg
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="bg-muted text-muted-foreground p-3 rounded">
                                        Muted bg + Muted fg
                                    </div>
                                    <div className="bg-card text-card-foreground border border-border p-3 rounded">
                                        Card bg + Card fg
                                    </div>
                                    <div className="bg-destructive text-destructive-foreground p-3 rounded">
                                        Destructive bg + Destructive fg
                                    </div>
                                </div>
                            </div>
                        </ThemeCard>

                        <div className="border-t-2 border-border pt-4" />
                    </section>
                ))}
            </div>

            {/* Footer */}
            <footer className="text-center py-12 border-t border-border">
                <p className="text-muted-foreground">
                    ✨ All themes tested • {themes.length} color palettes • Full typography & component coverage
                </p>
            </footer>
        </div>
    );
}
