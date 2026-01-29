import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast } from 'culori';
import { themePresets } from '../src/server/theme/theme-presets';
import { themeTokenKeys, type ThemeTokenKey, type ThemeTokenMap } from '../src/server/theme/tokens';

interface AuditPair {
    name: string;
    text: string;
    background: string;
    minRatio: number;
}

type TokenMap = Record<string, string | undefined>;
type TokenOverrides = Partial<Record<ThemeTokenKey, string>>;

const tokenPairs: AuditPair[] = [
    { name: 'foreground on background', text: 'foreground', background: 'background', minRatio: 4.5 },
    { name: 'foreground on card', text: 'foreground', background: 'card', minRatio: 4.5 },
    { name: 'muted-foreground on background', text: 'muted-foreground', background: 'background', minRatio: 4.5 },
    { name: 'muted-foreground on muted', text: 'muted-foreground', background: 'muted', minRatio: 4.5 },
    { name: 'primary-foreground on primary', text: 'primary-foreground', background: 'primary', minRatio: 4.5 },
    { name: 'secondary-foreground on secondary', text: 'secondary-foreground', background: 'secondary', minRatio: 4.5 },
    { name: 'accent-foreground on accent', text: 'accent-foreground', background: 'accent', minRatio: 4.5 },
    { name: 'destructive-foreground on destructive', text: 'destructive-foreground', background: 'destructive', minRatio: 4.5 },
    { name: 'border on background', text: 'border', background: 'background', minRatio: 3 },
    { name: 'ring on background', text: 'ring', background: 'background', minRatio: 3 },
];

function extractBlock(css: string, selector: string): string | null {
    let searchIndex = 0;
    while (searchIndex < css.length) {
        const start = css.indexOf(selector, searchIndex);
        if (start === -1) {
            return null;
        }
        const braceStart = css.indexOf('{', start);
        if (braceStart === -1) {
            return null;
        }
        let depth = 0;
        for (let index = braceStart; index < css.length; index += 1) {
            if (css[index] === '{') {
                depth += 1;
            } else if (css[index] === '}') {
                depth -= 1;
                if (depth === 0) {
                    return css.slice(braceStart + 1, index);
                }
            }
        }
        searchIndex = braceStart + 1;
    }
    return null;
}

function extractBlockWithToken(css: string, selector: string, token: string): string | null {
    let searchIndex = 0;
    while (searchIndex < css.length) {
        const start = css.indexOf(selector, searchIndex);
        if (start === -1) {
            return null;
        }
        const braceStart = css.indexOf('{', start);
        if (braceStart === -1) {
            return null;
        }
        let depth = 0;
        for (let index = braceStart; index < css.length; index += 1) {
            if (css[index] === '{') {
                depth += 1;
            } else if (css[index] === '}') {
                depth -= 1;
                if (depth === 0) {
                    const block = css.slice(braceStart + 1, index);
                    if (block.includes(`--${token}:`)) {
                        return block;
                    }
                    break;
                }
            }
        }
        searchIndex = braceStart + 1;
    }
    return null;
}

function parseTokens(block: string): TokenMap {
    const tokens: TokenMap = {};
    const regex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let match: RegExpExecArray | null = regex.exec(block);
    while (match) {
        tokens[match[1]] = match[2].trim();
        match = regex.exec(block);
    }
    return tokens;
}

function toColor(value?: string): string | null {
    if (!value) {
        return null;
    }
    const normalized = value.trim();
    if (normalized.startsWith('oklch(') || normalized.startsWith('hsl(')) {
        return value;
    }
    if (normalized.startsWith('var(') || normalized.includes('gradient')) {
        return null;
    }
    if (normalized.includes('%')) {
        return `hsl(${normalized})`;
    }
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length < 3) {
        return null;
    }
    const [l, c, h] = parts;
    if (!l || !c || !h) {
        return null;
    }
    return `oklch(${l} ${c} ${h})`;
}

function auditBlock(label: string, tokens: TokenMap) {
    console.log(`\n${label}`);
    for (const pair of tokenPairs) {
        const text = toColor(tokens[pair.text]);
        const background = toColor(tokens[pair.background]);
        if (!text || !background) {
            console.log(`- ${pair.name}: skipped (missing tokens)`);
            continue;
        }
        const ratio = wcagContrast(text, background);
        const pass = ratio >= pair.minRatio ? 'PASS' : 'FAIL';
        console.log(`- ${pair.name}: ${ratio.toFixed(2)} (${pass}, min ${pair.minRatio.toFixed(2)})`);
    }
}

function mergeOverrides(tokens: ThemeTokenMap, overrides: TokenOverrides): TokenMap {
    if (!Object.keys(overrides).length) {
        return tokens;
    }
    return {
        ...tokens,
        ...overrides,
    };
}

function pickOverrides(raw: Record<string, unknown>): TokenOverrides {
    const overrides: TokenOverrides = {};
    for (const key of themeTokenKeys) {
        const value = raw[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            overrides[key] = value.trim();
        }
    }
    return overrides;
}

function loadOverrides(path: string | null): TokenOverrides {
    if (!path) {
        return {};
    }
    const content = readFileSync(path, 'utf8');
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error(`Failed to parse overrides JSON at ${path}`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Overrides JSON must be an object of token values at ${path}`);
    }
    return pickOverrides(parsed as Record<string, unknown>);
}

function findArgumentValue(args: string[], key: string): string | null {
    const index = args.indexOf(key);
    if (index === -1) {
        return null;
    }
    const value = args[index + 1];
    return value && !value.startsWith('--') ? value : null;
}

function auditPreset(
    labelPrefix: string,
    tokens: ThemeTokenMap,
    darkTokens: ThemeTokenMap,
    overrides: TokenOverrides,
) {
    const suffix = Object.keys(overrides).length ? ' (with overrides)' : '';
    auditBlock(`${labelPrefix} Light${suffix}`, mergeOverrides(tokens, overrides));
    auditBlock(`${labelPrefix} Dark${suffix}`, mergeOverrides(darkTokens, overrides));
}

function main() {
    const args = process.argv.slice(2);
    const overridesPath = findArgumentValue(args, '--overrides');
    const presetFilter = findArgumentValue(args, '--preset');
    const overrides = loadOverrides(overridesPath);

    const globalsPath = join(process.cwd(), 'src', 'app', 'globals.css');
    const css = readFileSync(globalsPath, 'utf8');
    const rootBlock = extractBlock(css, ':root');
    const darkBlock = extractBlockWithToken(css, '.dark', 'background') ?? '';

    if (!rootBlock) {
        throw new Error('Failed to find :root block in globals.css');
    }

    const rootTokens = parseTokens(rootBlock);
    auditBlock('Light theme', rootTokens);

    if (darkBlock.length > 0) {
        const darkTokens = parseTokens(darkBlock);
        auditBlock('Dark theme', darkTokens);
    } else {
        console.log('\nDark theme: skipped (no .dark block found)');
    }

    const presetEntries = Object.values(themePresets);
    const filteredPresets = presetFilter
        ? presetEntries.filter((preset) => preset.id === presetFilter)
        : presetEntries;

    for (const preset of filteredPresets) {
        auditPreset(`Preset ${preset.name} (${preset.id})`, preset.tokens, preset.darkTokens, overrides);
    }
}

main();
