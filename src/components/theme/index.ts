/**
 * 🎨 Theme Component Library - Central Exports
 * 
 * Barrel exports for all theme-aware components.
 * Makes imports cleaner and more maintainable.
 * 
 * @module components/theme
 */

// Theme System
export { ThemeProvider, useTheme, THEME_PRESETS, type ThemeId } from './theme-provider';
export { ThemeSwitcher } from './theme-switcher';

// Primitives - Surfaces
export {
    Container,
    GlassSurface,
    GradientAccent,
    type ContainerProps,
    type GlassSurfaceProps,
    type GradientAccentProps,
} from './primitives/surfaces';

// Primitives - Interactive
export {
    ThemeButton,
    ThemeIconButton,
    ThemeBadge,
    type ThemeButtonProps,
    type ThemeIconButtonProps,
    type ThemeBadgeProps,
} from './primitives/interactive';

// Cards
export {
    ThemeCard,
    ThemeCardHeader,
    ThemeCardTitle,
    ThemeCardDescription,
    ThemeCardContent,
    ThemeCardFooter,
    type ThemeCardProps,
    type ThemeCardHeaderProps,
    type ThemeCardTitleProps,
    type ThemeCardDescriptionProps,
    type ThemeCardContentProps,
    type ThemeCardFooterProps,
} from './cards/theme-card';

// Layout
export {
    ThemeGrid,
    ThemeFlex,
    ThemeSection,
    ThemeStack,
    type ThemeGridProps,
    type ThemeFlexProps,
    type ThemeSectionProps,
    type ThemeStackProps,
} from './layout/primitives';

// Decorative
export {
    Shimmer,
    GlowEffect,
    GradientOrb,
    ThemeDivider,
    type ShimmerProps,
    type GlowEffectProps,
    type GradientOrbProps,
    type ThemeDividerProps,
} from './decorative/effects';

// Theme Registry (Server Component)
export { TenantThemeRegistry, type TenantThemeRegistryProps } from './tenant-theme-registry';
