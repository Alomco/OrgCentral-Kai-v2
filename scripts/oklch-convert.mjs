import fs from 'fs';
import { parse, converter } from 'culori';

const toOklch = converter('oklch');
const files = [
  'src/server/theme/tokens.ts',
  'src/server/theme/theme-presets.shared.ts',
  'src/server/theme/theme-presets.group-a.ts',
  'src/server/theme/theme-presets.group-b.ts',
];

const hslRe = /(?:'|")((?:\d+\.?\d*)\s+(?:\d+\.?\d*)%\s+(?:\d+\.?\d*)%)(?:'|")/g;
const seen = new Set();

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = hslRe.exec(text))) {
    seen.add(match[1]);
  }
}

const fmt = (value) => {
  const l = Number.isFinite(value?.l) ? value.l : 0;
  const c = Number.isFinite(value?.c) ? value.c : 0;
  const h = Number.isFinite(value?.h) ? value.h : 0;
  return `${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)}`;
};

const results = [...seen]
  .sort((a, b) => a.localeCompare(b))
  .map((hsl) => {
    const parsed = parse(`hsl(${hsl})`);
    const oklch = parsed ? toOklch(parsed) : null;
    return `${hsl} -> ${oklch ? fmt(oklch) : 'ERR'}`;
  });

console.log(results.join('\n'));
