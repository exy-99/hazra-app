// Self-check for plan 01-02 Task 2: Type + Radius scales in src/constants/theme.ts.
// Run: node scripts/verify-theme-scale.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync('src/constants/theme.ts', 'utf8');
const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

let failures = 0;
function check(ok, label, detail = '') {
  console.log(`${ok ? 'ok' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures++;
}

check(/export const Type\b/.test(code), 'Type export present');
check(/export const Radius\b/.test(code), 'Radius export present');

// No src/theme/ parallel system (AGENTS.md hard constraint).
import { existsSync } from 'node:fs';
check(!existsSync('src/theme'), 'no src/theme/ directory');

// Type scale values from design.md §5 — verified via a runtime import-free parse:
// extract the Type block and read fontSize numbers.
const typeBlock = code.match(/export const Type\s*=\s*\{([\s\S]*?)\n\} as const/);
check(!!typeBlock, 'Type block parseable');
if (typeBlock) {
  const sizes = [...typeBlock[1].matchAll(/fontSize:\s*(\d+)/g)].map((m) => Number(m[1]));
  check(sizes.length === 6, 'six type sizes', `found ${sizes.length}`);
  const min = Math.min(...sizes);
  check(min >= 13, 'nothing below 13px', `min ${min}`);
  const expected = [48, 28, 20, 16, 14, 13];
  check(
    expected.every((s) => sizes.includes(s)),
    'display/h1/h2/body/label/caption sizes',
    `found [${sizes.join(', ')}]`
  );
}

const radiusBlock = code.match(/export const Radius\s*=\s*\{([\s\S]*?)\} as const/);
check(!!radiusBlock, 'Radius block parseable');
if (radiusBlock) {
  const get = (k) => Number(radiusBlock[1].match(new RegExp(`${k}:\\s*(\\d+)`))?.[1]);
  check(get('sm') === 8, 'Radius.sm === 8', `got ${get('sm')}`);
  check(get('md') === 12, 'Radius.md === 12', `got ${get('md')}`);
  check(get('lg') === 16, 'Radius.lg === 16', `got ${get('lg')}`);
  check(get('pill') === 999, 'Radius.pill === 999', `got ${get('pill')}`);
}

// Color tokens from Task 1 undisturbed.
check(code.includes("'#0D9488'"), 'light primary intact');
check(code.includes("'#2DD4BF'"), 'dark primary intact');
check(/export type ThemeColor/.test(code), 'ThemeColor type intact');

if (failures > 0) {
  console.error(`\ntheme scale check FAILED (${failures} failure${failures === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log('\ntheme scale ok');
