import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast } from 'culori';

interface AuditPair {
    name: string;
    text: string;
    background: string;
    minRatio: number;
}

interface TokenMap {
    [key: string]: string | undefined;
}

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
        for (let i = braceStart; i < css.length; i += 1) {
            if (css[i] === '{') {
                depth += 1;
            } else if (css[i] === '}') {
                depth -= 1;
                if (depth === 0) {
                    return css.slice(braceStart + 1, i);
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
        for (let i = braceStart; i < css.length; i += 1) {
            if (css[i] === '{') {
                depth += 1;
            } else if (css[i] === '}') {
                depth -= 1;
                if (depth === 0) {
                    const block = css.slice(braceStart + 1, i);
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

function toOklch(value?: string): string | null {
    if (!value) {
        return null;
    }
    if (value.startsWith('oklch(')) {
        return value;
    }
    if (value.startsWith('var(') || value.includes('gradient')) {
        return null;
    }
    const parts = value.split(/\s+/).filter(Boolean);
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
        const text = toOklch(tokens[pair.text]);
        const background = toOklch(tokens[pair.background]);
        if (!text || !background) {
            console.log(`- ${pair.name}: skipped (missing tokens)`);
            continue;
        }
        const ratio = wcagContrast(text, background);
        const pass = ratio >= pair.minRatio ? 'PASS' : 'FAIL';
        console.log(`- ${pair.name}: ${ratio.toFixed(2)} (${pass}, min ${pair.minRatio})`);
    }
}

function main() {
    const globalsPath = join(process.cwd(), 'src', 'app', 'globals.css');
    const css = readFileSync(globalsPath, 'utf8');
    const rootBlock = extractBlock(css, ':root');
    const darkBlock = extractBlockWithToken(css, '.dark', 'background');

    if (!rootBlock) {
        throw new Error('Failed to find :root block in globals.css');
    }

    const rootTokens = parseTokens(rootBlock);
    auditBlock('Light theme', rootTokens);

    if (darkBlock) {
        const darkTokens = parseTokens(darkBlock);
        auditBlock('Dark theme', darkTokens);
    } else {
        console.log('\nDark theme: skipped (no .dark block found)');
    }
}

main();
