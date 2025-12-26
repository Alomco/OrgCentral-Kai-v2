/**
 * 🎨 Theme Presets - Futuristic color schemes for tenant customization
 * 
 * Each preset defines a complete HSL color palette that creates
 * a cohesive, vibrant futuristic UI experience.
 */

import type { HslValue, ThemeTokenMap } from './tokens';

export interface ThemePreset {
    id: string;
    name: string;
    description: string;
    emoji: string;
    tokens: ThemeTokenMap;
}

// Base shared tokens for consistency
const baseTokens = {
    'destructive': '0 84% 60%' as HslValue,
    'destructive-foreground': '0 0% 100%' as HslValue,
} as const;

const HSL_CHART_CYAN = '200 98% 39%' as HslValue;
const HSL_CHART_YELLOW = '48 96% 53%' as HslValue;
const HSL_CHART_ORANGE = '31 87% 51%' as HslValue;

const cyberpunkForeground = '262 84% 5%' as HslValue;
const cyberpunkPrimary = '262 83% 58%' as HslValue;

// 🔮 Cyberpunk Purple - Default futuristic theme
const cyberpunkPurple: ThemePreset = {
    id: 'cyberpunk-purple',
    name: 'Cyberpunk Purple',
    description: 'Vibrant purple and pink with neon accents',
    emoji: '🔮',
    tokens: {
        ...baseTokens,
        'background': '262 30% 98%' as HslValue,
        'foreground': cyberpunkForeground,
        'card': '262 25% 97%' as HslValue,
        'card-foreground': cyberpunkForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': cyberpunkForeground,
        'primary': cyberpunkPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '262 40% 96%' as HslValue,
        'secondary-foreground': '262 84% 25%' as HslValue,
        'muted': '262 20% 96%' as HslValue,
        'muted-foreground': '262 16% 47%' as HslValue,
        'accent': '330 81% 60%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '262 32% 91%' as HslValue,
        'input': '262 32% 91%' as HslValue,
        'ring': cyberpunkPrimary,
        'chart-1': '330 81% 60%' as HslValue,
        'chart-2': cyberpunkPrimary,
        'chart-3': HSL_CHART_CYAN,
        'chart-4': HSL_CHART_YELLOW,
        'chart-5': HSL_CHART_ORANGE,
        'sidebar': '262 45% 12%' as HslValue,
        'sidebar-background': '262 45% 12%' as HslValue,
        'sidebar-foreground': '262 20% 96%' as HslValue,
        'sidebar-primary': '262 83% 65%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '330 70% 55%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '262 35% 20%' as HslValue,
        'sidebar-ring': cyberpunkPrimary,
    },
};

// 🌊 Ocean Depths - Cool blue/cyan theme
const oceanForeground = '200 84% 5%' as HslValue;
const oceanDepths: ThemePreset = {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    description: 'Deep blues and cyan with aquatic vibes',
    emoji: '🌊',
    tokens: {
        ...baseTokens,
        'background': '200 30% 98%' as HslValue,
        'foreground': oceanForeground,
        'card': '200 25% 97%' as HslValue,
        'card-foreground': oceanForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': oceanForeground,
        'primary': HSL_CHART_CYAN,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '200 40% 96%' as HslValue,
        'secondary-foreground': '200 84% 25%' as HslValue,
        'muted': '200 20% 96%' as HslValue,
        'muted-foreground': '200 16% 47%' as HslValue,
        'accent': '175 80% 40%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '200 32% 91%' as HslValue,
        'input': '200 32% 91%' as HslValue,
        'ring': HSL_CHART_CYAN,
        'chart-1': '175 80% 40%' as HslValue,
        'chart-2': HSL_CHART_CYAN,
        'chart-3': '220 90% 56%' as HslValue,
        'chart-4': HSL_CHART_YELLOW,
        'chart-5': HSL_CHART_ORANGE,
        'sidebar': '200 50% 10%' as HslValue,
        'sidebar-background': '200 50% 10%' as HslValue,
        'sidebar-foreground': '200 20% 96%' as HslValue,
        'sidebar-primary': '175 80% 50%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '200 90% 45%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '200 35% 20%' as HslValue,
        'sidebar-ring': HSL_CHART_CYAN,
    },
};

// 🌅 Sunset Blaze - Warm orange/red theme
const sunsetPrimary = '25 95% 53%' as HslValue;
const sunsetAccent = '350 80% 55%' as HslValue;
const sunsetBlaze: ThemePreset = {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    description: 'Warm oranges and fiery reds',
    emoji: '🌅',
    tokens: {
        ...baseTokens,
        'background': '25 30% 98%' as HslValue,
        'foreground': '25 84% 5%' as HslValue,
        'card': '25 25% 97%' as HslValue,
        'card-foreground': '25 84% 5%' as HslValue,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': '25 84% 5%' as HslValue,
        'primary': sunsetPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '25 40% 96%' as HslValue,
        'secondary-foreground': '25 84% 25%' as HslValue,
        'muted': '25 20% 96%' as HslValue,
        'muted-foreground': '25 16% 47%' as HslValue,
        'accent': sunsetAccent,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '25 32% 91%' as HslValue,
        'input': '25 32% 91%' as HslValue,
        'ring': sunsetPrimary,
        'chart-1': sunsetAccent,
        'chart-2': sunsetPrimary,
        'chart-3': '45 93% 47%' as HslValue,
        'chart-4': HSL_CHART_YELLOW,
        'chart-5': '0 72% 51%' as HslValue,
        'sidebar': '25 50% 10%' as HslValue,
        'sidebar-background': '25 50% 10%' as HslValue,
        'sidebar-foreground': '25 20% 96%' as HslValue,
        'sidebar-primary': '25 95% 60%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '350 75% 60%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '25 35% 20%' as HslValue,
        'sidebar-ring': sunsetPrimary,
    },
};

// 🌿 Forest Emerald - Rich green theme
    const forestForeground = '150 84% 5%' as HslValue;
    const forestPrimary = '160 84% 39%' as HslValue;
const forestEmerald: ThemePreset = {
    id: 'forest-emerald',
    name: 'Forest Emerald',
    description: 'Rich greens with natural energy',
    emoji: '🌿',
    tokens: {
        ...baseTokens,
        'background': '150 30% 98%' as HslValue,
        'foreground': forestForeground,
        'card': '150 25% 97%' as HslValue,
        'card-foreground': forestForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': forestForeground,
        'primary': forestPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '150 40% 96%' as HslValue,
        'secondary-foreground': '150 84% 25%' as HslValue,
        'muted': '150 20% 96%' as HslValue,
        'muted-foreground': '150 16% 47%' as HslValue,
        'accent': '120 60% 45%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '150 32% 91%' as HslValue,
        'input': '150 32% 91%' as HslValue,
        'ring': forestPrimary,
        'chart-1': '120 60% 45%' as HslValue,
        'chart-2': forestPrimary,
        'chart-3': '180 70% 40%' as HslValue,
        'chart-4': HSL_CHART_YELLOW,
        'chart-5': '90 60% 40%' as HslValue,
        'sidebar': '150 50% 10%' as HslValue,
        'sidebar-background': '150 50% 10%' as HslValue,
        'sidebar-foreground': '150 20% 96%' as HslValue,
        'sidebar-primary': '160 84% 45%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '120 55% 50%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '150 35% 20%' as HslValue,
        'sidebar-ring': forestPrimary,
    },
};

// ⚡ Neon Electric - High-contrast neon theme
    const neonForeground = '240 84% 5%' as HslValue;
    const neonPrimary = '280 100% 60%' as HslValue;
    const neonAccent = '180 100% 50%' as HslValue;
const neonElectric: ThemePreset = {
    id: 'neon-electric',
    name: 'Neon Electric',
    description: 'High-energy neon with electric vibes',
    emoji: '⚡',
    tokens: {
        ...baseTokens,
        'background': '240 20% 98%' as HslValue,
        'foreground': neonForeground,
        'card': '240 15% 97%' as HslValue,
        'card-foreground': neonForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': neonForeground,
        'primary': neonPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '240 40% 96%' as HslValue,
        'secondary-foreground': '280 84% 25%' as HslValue,
        'muted': '240 20% 96%' as HslValue,
        'muted-foreground': '240 16% 47%' as HslValue,
        'accent': neonAccent,
        'accent-foreground': neonForeground,
        'border': '240 32% 91%' as HslValue,
        'input': '240 32% 91%' as HslValue,
        'ring': neonPrimary,
        'chart-1': neonAccent,
        'chart-2': neonPrimary,
        'chart-3': '60 100% 50%' as HslValue,
        'chart-4': '330 100% 60%' as HslValue,
        'chart-5': '120 100% 50%' as HslValue,
        'sidebar': '240 40% 8%' as HslValue,
        'sidebar-background': '240 40% 8%' as HslValue,
        'sidebar-foreground': '180 100% 90%' as HslValue,
        'sidebar-primary': neonAccent,
        'sidebar-primary-foreground': neonForeground,
        'sidebar-accent': neonPrimary,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '280 50% 25%' as HslValue,
        'sidebar-ring': neonAccent,
    },
};

// 🍇 Royal Velvet - Luxurious deep purple
    const royalForeground = '270 84% 5%' as HslValue;
    const royalPrimary = '270 70% 45%' as HslValue;
    const royalAccent = '45 90% 50%' as HslValue;
const royalVelvet: ThemePreset = {
    id: 'royal-velvet',
    name: 'Royal Velvet',
    description: 'Luxurious deep purples with gold accents',
    emoji: '🍇',
    tokens: {
        ...baseTokens,
        'background': '270 20% 98%' as HslValue,
        'foreground': royalForeground,
        'card': '270 15% 97%' as HslValue,
        'card-foreground': royalForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': royalForeground,
        'primary': royalPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '270 40% 96%' as HslValue,
        'secondary-foreground': '270 84% 25%' as HslValue,
        'muted': '270 20% 96%' as HslValue,
        'muted-foreground': '270 16% 47%' as HslValue,
        'accent': royalAccent,
        'accent-foreground': royalForeground,
        'border': '270 32% 91%' as HslValue,
        'input': '270 32% 91%' as HslValue,
        'ring': royalPrimary,
        'chart-1': royalAccent,
        'chart-2': royalPrimary,
        'chart-3': '300 60% 50%' as HslValue,
        'chart-4': HSL_CHART_YELLOW,
        'chart-5': '330 70% 50%' as HslValue,
        'sidebar': '270 50% 12%' as HslValue,
        'sidebar-background': '270 50% 12%' as HslValue,
        'sidebar-foreground': '270 20% 96%' as HslValue,
        'sidebar-primary': '45 90% 55%' as HslValue,
        'sidebar-primary-foreground': royalForeground,
        'sidebar-accent': '270 60% 55%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '270 35% 22%' as HslValue,
        'sidebar-ring': royalPrimary,
    },
};

// 🔥 Inferno Red - Bold red with hot accents
const infernoPrimary = '355 85% 55%' as HslValue;
const infernoRed: ThemePreset = {
    id: 'inferno-red',
    name: 'Inferno Red',
    description: 'Bold reds with fiery orange highlights',
    emoji: '🔥',
    tokens: {
        ...baseTokens,
        'background': '0 20% 98%' as HslValue,
        'foreground': '0 84% 5%' as HslValue,
        'card': '0 15% 97%' as HslValue,
        'card-foreground': '0 84% 5%' as HslValue,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': '0 84% 5%' as HslValue,
        'primary': infernoPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '0 40% 96%' as HslValue,
        'secondary-foreground': '0 84% 25%' as HslValue,
        'muted': '0 20% 96%' as HslValue,
        'muted-foreground': '0 16% 47%' as HslValue,
        'accent': '20 90% 55%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '0 32% 91%' as HslValue,
        'input': '0 32% 91%' as HslValue,
        'ring': infernoPrimary,
        'chart-1': infernoPrimary,
        'chart-2': '20 90% 55%' as HslValue,
        'chart-3': '35 85% 50%' as HslValue,
        'chart-4': '10 80% 50%' as HslValue,
        'chart-5': '45 75% 55%' as HslValue,
        'sidebar': '355 45% 10%' as HslValue,
        'sidebar-background': '355 45% 10%' as HslValue,
        'sidebar-foreground': '0 20% 96%' as HslValue,
        'sidebar-primary': '355 85% 60%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '20 85% 60%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '355 35% 20%' as HslValue,
        'sidebar-ring': infernoPrimary,
    },
};

// 🌸 Cherry Blossom - Soft pink with delicate accents
    const cherryForeground = '340 84% 5%' as HslValue;
    const cherryPrimary = '340 75% 60%' as HslValue;
const cherryBlossom: ThemePreset = {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    description: 'Soft pinks with spring freshness',
    emoji: '🌸',
    tokens: {
        ...baseTokens,
        'background': '340 30% 98%' as HslValue,
        'foreground': cherryForeground,
        'card': '340 25% 97%' as HslValue,
        'card-foreground': cherryForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': cherryForeground,
        'primary': cherryPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '340 40% 96%' as HslValue,
        'secondary-foreground': '340 84% 25%' as HslValue,
        'muted': '340 20% 96%' as HslValue,
        'muted-foreground': '340 16% 47%' as HslValue,
        'accent': '320 70% 58%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '340 32% 91%' as HslValue,
        'input': '340 32% 91%' as HslValue,
        'ring': cherryPrimary,
        'chart-1': cherryPrimary,
        'chart-2': '320 70% 58%' as HslValue,
        'chart-3': '350 65% 55%' as HslValue,
        'chart-4': '300 60% 50%' as HslValue,
        'chart-5': '330 68% 52%' as HslValue,
        'sidebar': '340 45% 12%' as HslValue,
        'sidebar-background': '340 45% 12%' as HslValue,
        'sidebar-foreground': '340 20% 96%' as HslValue,
        'sidebar-primary': '340 75% 65%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '320 70% 63%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '340 35% 22%' as HslValue,
        'sidebar-ring': cherryPrimary,
    },
};

// 🌌 Galaxy Indigo - Deep space with cosmic blues
    const galaxyForeground = '230 84% 5%' as HslValue;
    const galaxyPrimary = '230 80% 50%' as HslValue;
const galaxyIndigo: ThemePreset = {
    id: 'galaxy-indigo',
    name: 'Galaxy Indigo',
    description: 'Deep cosmic indigo with starlight highlights',
    emoji: '🌌',
    tokens: {
        ...baseTokens,
        'background': '230 30% 98%' as HslValue,
        'foreground': galaxyForeground,
        'card': '230 25% 97%' as HslValue,
        'card-foreground': galaxyForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': galaxyForeground,
        'primary': galaxyPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '230 40% 96%' as HslValue,
        'secondary-foreground': '230 84% 25%' as HslValue,
        'muted': '230 20% 96%' as HslValue,
        'muted-foreground': '230 16% 47%' as HslValue,
        'accent': '250 90% 65%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '230 32% 91%' as HslValue,
        'input': '230 32% 91%' as HslValue,
        'ring': galaxyPrimary,
        'chart-1': galaxyPrimary,
        'chart-2': '250 90% 65%' as HslValue,
        'chart-3': '210 85% 55%' as HslValue,
        'chart-4': '270 75% 60%' as HslValue,
        'chart-5': '200 80% 50%' as HslValue,
        'sidebar': '230 50% 8%' as HslValue,
        'sidebar-background': '230 50% 8%' as HslValue,
        'sidebar-foreground': '230 20% 96%' as HslValue,
        'sidebar-primary': '230 80% 55%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '250 85% 70%' as HslValue,
        'sidebar-accent-foreground': galaxyForeground,
        'sidebar-border': '230 40% 18%' as HslValue,
        'sidebar-ring': galaxyPrimary,
    },
};

// 🍊 Tangerine Dream - Vibrant orange with citrus energy
const tangerinePrimary = '35 95% 58%' as HslValue;
const tangerineDream: ThemePreset = {
    id: 'tangerine-dream',
    name: 'Tangerine Dream',
    description: 'Vibrant orange with fresh citrus energy',
    emoji: '🍊',
    tokens: {
        ...baseTokens,
        'background': '35 30% 98%' as HslValue,
        'foreground': '35 84% 5%' as HslValue,
        'card': '35 25% 97%' as HslValue,
        'card-foreground': '35 84% 5%' as HslValue,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': '35 84% 5%' as HslValue,
        'primary': tangerinePrimary,
        'primary-foreground': '35 84% 5%' as HslValue,
        'secondary': '35 40% 96%' as HslValue,
        'secondary-foreground': '35 84% 25%' as HslValue,
        'muted': '35 20% 96%' as HslValue,
        'muted-foreground': '35 16% 47%' as HslValue,
        'accent': '25 92% 55%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '35 32% 91%' as HslValue,
        'input': '35 32% 91%' as HslValue,
        'ring': tangerinePrimary,
        'chart-1': tangerinePrimary,
        'chart-2': '25 92% 55%' as HslValue,
        'chart-3': '45 90% 50%' as HslValue,
        'chart-4': '15 88% 52%' as HslValue,
        'chart-5': '50 85% 55%' as HslValue,
        'sidebar': '35 50% 10%' as HslValue,
        'sidebar-background': '35 50% 10%' as HslValue,
        'sidebar-foreground': '35 20% 96%' as HslValue,
        'sidebar-primary': '35 95% 63%' as HslValue,
        'sidebar-primary-foreground': '35 84% 5%' as HslValue,
        'sidebar-accent': '25 90% 60%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '35 35% 20%' as HslValue,
        'sidebar-ring': tangerinePrimary,
    },
};

// 🎯 Ruby Matrix - Professional red with digital vibes
const rubyForeground = '350 84% 5%' as HslValue;
const rubyPrimary = '350 80% 50%' as HslValue;
const rubyMatrix: ThemePreset = {
    id: 'ruby-matrix',
    name: 'Ruby Matrix',
    description: 'Professional ruby red with digital energy',
    emoji: '🎯',
    tokens: {
        ...baseTokens,
        'background': '350 25% 98%' as HslValue,
        'foreground': rubyForeground,
        'card': '350 20% 97%' as HslValue,
        'card-foreground': rubyForeground,
        'popover': '0 0% 100%' as HslValue,
        'popover-foreground': rubyForeground,
        'primary': rubyPrimary,
        'primary-foreground': '0 0% 100%' as HslValue,
        'secondary': '350 40% 96%' as HslValue,
        'secondary-foreground': '350 84% 25%' as HslValue,
        'muted': '350 20% 96%' as HslValue,
        'muted-foreground': '350 16% 47%' as HslValue,
        'accent': '5 75% 52%' as HslValue,
        'accent-foreground': '0 0% 100%' as HslValue,
        'border': '350 32% 91%' as HslValue,
        'input': '350 32% 91%' as HslValue,
        'ring': rubyPrimary,
        'chart-1': rubyPrimary,
        'chart-2': '5 75% 52%' as HslValue,
        'chart-3': '340 75% 55%' as HslValue,
        'chart-4': '10 78% 50%' as HslValue,
        'chart-5': '330 72% 52%' as HslValue,
        'sidebar': '350 48% 10%' as HslValue,
        'sidebar-background': '350 48% 10%' as HslValue,
        'sidebar-foreground': '350 20% 96%' as HslValue,
        'sidebar-primary': '350 80% 55%' as HslValue,
        'sidebar-primary-foreground': '0 0% 100%' as HslValue,
        'sidebar-accent': '5 75% 57%' as HslValue,
        'sidebar-accent-foreground': '0 0% 100%' as HslValue,
        'sidebar-border': '350 35% 20%' as HslValue,
        'sidebar-ring': rubyPrimary,
    },
};

/** All available theme presets */
export const themePresets = {
    'cyberpunk-purple': cyberpunkPurple,
    'ocean-depths': oceanDepths,
    'sunset-blaze': sunsetBlaze,
    'forest-emerald': forestEmerald,
    'neon-electric': neonElectric,
    'royal-velvet': royalVelvet,
    'inferno-red': infernoRed,
    'cherry-blossom': cherryBlossom,
    'galaxy-indigo': galaxyIndigo,
    'tangerine-dream': tangerineDream,
    'ruby-matrix': rubyMatrix,
} as const satisfies Record<string, ThemePreset>;

export type ThemePresetId = keyof typeof themePresets;

/** Default theme preset ID */
export const defaultPresetId: ThemePresetId = 'cyberpunk-purple';

export function isThemePresetId(value: string): value is ThemePresetId {
    return Object.prototype.hasOwnProperty.call(themePresets, value);
}

/** Get preset by ID, falls back to default */
export function getThemePreset(presetId: string): ThemePreset {
    const resolvedId: ThemePresetId = isThemePresetId(presetId) ? presetId : defaultPresetId;
    return themePresets[resolvedId];
}

/** Get all preset options for UI selectors */
export interface ThemePresetOption { id: string; name: string; emoji: string; description: string }

export function getPresetOptions(): ThemePresetOption[] {
    return Object.values(themePresets).map(({ id, name, emoji, description }) => ({
        id,
        name,
        emoji,
        description,
    }));
}
