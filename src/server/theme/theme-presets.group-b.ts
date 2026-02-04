import type { ColorTokenValue } from './tokens';
import {
    accents,
    DARK_BORDER,
    DARK_MUTED_FOREGROUND,
    GALAXY_FOREGROUND,
    INK,
    LIGHT_BORDER,
    LIGHT_MUTED_FOREGROUND,
    makePreset,
    surface,
    TANGERINE_FOREGROUND,
    WHITE,
} from './theme-presets.shared';
import type { ThemePreset } from './theme-presets.shared';

const infernoPrimary: ColorTokenValue = '0.6142 0.2261 23.63';
const cherryPrimary: ColorTokenValue = '0.6423 0.1921 3.90';
const galaxyPrimary: ColorTokenValue = '0.4710 0.2532 265.81';
const tangerinePrimary: ColorTokenValue = '0.7875 0.1578 69.41';
const tangerineAccent: ColorTokenValue = '0.7121 0.1760 49.98';
const rubyPrimary: ColorTokenValue = '0.5907 0.2277 21.33';
const corporatePrimary: ColorTokenValue = '0.4899 0.1991 262.15';
const corporateAccent: ColorTokenValue = '0.5679 0.1167 237.25';

export const themePresetsGroupB = {
    'inferno-red': makePreset({
        id: 'inferno-red',
        name: 'Inferno Red',
        description: 'Bold reds with fiery orange highlights',
        emoji: '??',
        accents: accents(infernoPrimary, INK, '0.6848 0.1857 43.13', INK, infernoPrimary, infernoPrimary, '0.6848 0.1857 43.13', '0.7358 0.1599 66.01', '0.6091 0.2110 32.84', '0.7974 0.1467 89.35', '0.6383 0.2088 21.10', WHITE, '0.7083 0.1592 45.34', WHITE, infernoPrimary),
        light: surface('0.9690 0.0134 5.81', '0.2216 0.0406 10.34', '0.9900 0.0039 5.55', '0.9292 0.0159 5.89', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9633 0.0101 5.72', '0.3011 0.0471 9.54'),
        dark: surface('0.1810 0.0285 9.57', '0.9501 0.0067 5.63', '0.2226 0.0355 9.63', '0.2632 0.0389 9.30', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2015 0.0347 10.00', '0.9165 0.0113 5.77'),
    }),
    'cherry-blossom': makePreset({
        id: 'cherry-blossom',
        name: 'Cherry Blossom',
        description: 'Soft pinks with spring freshness',
        emoji: '??',
        accents: accents(cherryPrimary, INK, '0.6444 0.2111 343.76', INK, cherryPrimary, cherryPrimary, '0.6444 0.2111 343.76', '0.5984 0.1849 15.26', '0.6131 0.2458 328.07', '0.5976 0.2118 355.52', '0.6776 0.1706 1.91', WHITE, '0.6776 0.1904 342.62', WHITE, cherryPrimary),
        light: surface('0.9695 0.0142 355.01', '0.2231 0.0419 359.80', '0.9901 0.0041 354.71', '0.9299 0.0167 355.10', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9638 0.0106 354.90', '0.3029 0.0487 359.00'),
        dark: surface('0.1821 0.0295 359.04', '0.9503 0.0071 354.80', '0.2240 0.0368 359.10', '0.2647 0.0403 358.76', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2028 0.0359 359.47', '0.9169 0.0120 354.96'),
    }),
    'galaxy-indigo': makePreset({
        id: 'galaxy-indigo',
        name: 'Galaxy Indigo',
        description: 'Deep cosmic indigo with starlight highlights',
        emoji: '??',
        accents: accents(galaxyPrimary, WHITE, '0.5726 0.2281 284.18', '0.98 0 0', '0.6 0.16 230', galaxyPrimary, '0.5726 0.2281 284.18', '0.6352 0.1705 252.53', '0.5876 0.2217 303.07', '0.6758 0.1453 238.46', '0.5113 0.2316 267.77', WHITE, '0.6341 0.1874 287.47', GALAXY_FOREGROUND, galaxyPrimary),
        light: surface('0.9690 0.0103 277.11', '0.2067 0.0460 273.21', '0.9901 0.0028 277.22', '0.9261 0.0163 277.01', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9623 0.0092 277.13', '0.2880 0.0473 274.44'),
        dark: surface('0.1730 0.0287 274.41', '0.9488 0.0069 277.16', '0.2127 0.0357 274.36', '0.2526 0.0391 274.62', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.1915 0.0349 274.07', '0.9143 0.0116 277.08'),
    }),
    'tangerine-dream': makePreset({
        id: 'tangerine-dream',
        name: 'Tangerine Dream',
        description: 'Vibrant orange with fresh citrus energy',
        emoji: '??',
        accents: accents(tangerinePrimary, TANGERINE_FOREGROUND, tangerineAccent, INK, '0.6 0.16 35', tangerinePrimary, tangerineAccent, '0.8153 0.1652 85.67', '0.6460 0.2065 36.66', '0.8520 0.1662 96.69', '0.8094 0.1456 71.81', TANGERINE_FOREGROUND, '0.7362 0.1573 52.74', WHITE, tangerinePrimary),
        light: surface('0.9825 0.0116 76.60', '0.2403 0.0375 46.98', '0.9941 0.0036 76.64', '0.9457 0.0147 76.57', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9746 0.0109 76.60', '0.3364 0.0387 65.87'),
        dark: surface('0.2007 0.0203 66.24', '0.9567 0.0055 76.63', '0.2472 0.0253 66.21', '0.2905 0.0278 66.37', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2251 0.0245 66.04', '0.9277 0.0092 76.60'),
    }),
    'ruby-matrix': makePreset({
        id: 'ruby-matrix',
        name: 'Ruby Matrix',
        description: 'Professional ruby red with digital energy',
        emoji: '??',
        accents: accents(rubyPrimary, WHITE, '0.5983 0.2069 29.67', INK, rubyPrimary, rubyPrimary, '0.5983 0.2069 29.67', '0.6123 0.2093 6.39', '0.6063 0.2071 32.93', '0.6024 0.2197 356.20', '0.6108 0.2162 18.15', WHITE, '0.6264 0.1893 28.79', WHITE, rubyPrimary),
        light: surface('0.9700 0.0117 5.76', '0.2216 0.0406 10.34', '0.9903 0.0033 5.54', '0.9292 0.0159 5.89', LIGHT_MUTED_FOREGROUND, LIGHT_BORDER, '0.9640 0.0089 5.69', '0.3011 0.0471 9.54'),
        dark: surface('0.1810 0.0285 9.57', '0.9501 0.0067 5.63', '0.2226 0.0355 9.63', '0.2632 0.0389 9.30', DARK_MUTED_FOREGROUND, DARK_BORDER, '0.2015 0.0347 10.00', '0.9165 0.0113 5.77'),
    }),
    'corporate-slate': makePreset({
        id: 'corporate-slate',
        name: 'Corporate Slate',
        description: 'Crisp neutrals with a confident blue accent',
        emoji: '??',
        accents: accents(
            corporatePrimary,
            WHITE,
            corporateAccent,
            INK,
            '0.6 0.16 220',
            '0.5876 0.1441 246.56',
            '0.6168 0.1170 165.63',
            '0.7358 0.1599 66.01',
            '0.5797 0.2102 312.33',
            '0.6024 0.2010 33.04',
            corporatePrimary,
            WHITE,
            '0.9517 0.0092 247.92',
            '0.2705 0.0253 256.84',
            corporatePrimary,
        ),
        light: surface(
            '0.9838 0.0035 247.86',
            '0.2299 0.0198 256.83',
            '0.9919 0.0017 247.84',
            '0.9524 0.0066 247.89',
            LIGHT_MUTED_FOREGROUND,
            LIGHT_BORDER,
            '0.9759 0.0046 247.87',
            '0.2705 0.0253 256.84',
        ),
        dark: surface(
            '0.1866 0.0167 256.83',
            '0.9686 0.0035 247.86',
            '0.2297 0.0206 256.83',
            '0.2721 0.0203 256.82',
            DARK_MUTED_FOREGROUND,
            DARK_BORDER,
            '0.2088 0.0176 256.83',
            '0.9210 0.0088 247.92',
        ),
    }),
} as const satisfies Record<string, ThemePreset>;
