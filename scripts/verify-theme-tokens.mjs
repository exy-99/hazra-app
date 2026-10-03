// Self-check for plan 01-02 Task 1: product color tokens in src/constants/theme.ts.
// Run: node scripts/verify-theme-tokens.mjs
// No test runner exists in this repo; this co-located node script is the RED/GREEN gate
// (allowed per .planning/phases/PLANNING-CONVENTIONS.md §1).
import { readFileSync } from 'node:fs';

const src = readFileSync('src/constants/theme.ts', 'utf8');
const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

let failures = 0;
function expectOnce(token, min = 1) {
  const count = code.split(token).length - 1;
  const ok = count >= min;
  console.log(`${ok ? 'ok' : 'FAIL'}  ${token} x${count} (min ${min})`);
  if (!ok) failures++;
}
function expectKey(key) {
  const re = new RegExp(`\\b${key}\\b`, 'g');
  const count = (code.match(re) ?? []).length;
  const ok = count >= 2; // once in light, once in dark
  console.log(`${ok ? 'ok' : 'FAIL'}  key ${key} x${count} (min 2)`);
  if (!ok) failures++;
}

// Exact light/dark primary + accent hexes (design.md §3).
expectOnce("'#0D9488'", 2); // light primary + light ring
expectOnce("'#2DD4BF'", 2); // dark primary + dark ring
expectOnce("'#EA580C'");
expectOnce("'#FB923C'");
expectOnce("'#DC2626'");
expectOnce("'#F87171'");

// Starter keys preserved for starter-component compatibility.
for (const key of ['backgroundElement', 'backgroundSelected', 'textSecondary']) {
  expectKey(key);
}
// 'text' must still exist (value overwritten to product foreground per plan).
expectKey('text');

// Every product key present in both modes.
for (const key of [
  'primary',
  'onPrimary',
  'secondary',
  'accent',
  'onAccent',
  'background',
  'surface',
  'foreground',
  'muted',
  'mutedForeground',
  'border',
  'ring',
  'destructive',
  'onDestructive',
]) {
  expectKey(key);
}

// Shape parity: light and dark blocks contain the same set of keys.
function blockKeys(mode) {
  const m = code.match(new RegExp(`${mode}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`));
  if (!m) {
    console.log(`FAIL  could not extract Colors.${mode} block`);
    failures++;
    return [];
  }
  return [...m[1].matchAll(/^\s*(\w+):/gm)].map((x) => x[1]).sort();
}
const lightKeys = blockKeys('light');
const darkKeys = blockKeys('dark');
const parity =
  lightKeys.length > 0 &&
  lightKeys.length === darkKeys.length &&
  lightKeys.every((k, i) => k === darkKeys[i]);
console.log(`${parity ? 'ok' : 'FAIL'}  light/dark shape parity (${lightKeys.length} vs ${darkKeys.length} keys)`);
if (!parity) {
  console.log(`  light-only: ${lightKeys.filter((k) => !darkKeys.includes(k)).join(', ') || '—'}`);
  console.log(`  dark-only: ${darkKeys.filter((k) => !lightKeys.includes(k)).join(', ') || '—'}`);
  failures++;
}

// ThemeColor type intact.
if (!/export type ThemeColor/.test(code)) {
  console.log('FAIL  ThemeColor type missing');
  failures++;
} else {
  console.log('ok  ThemeColor type present');
}

if (failures > 0) {
  console.error(`\ntheme tokens check FAILED (${failures} failure${failures === 1 ? '' : 's'})`);
  process.exit(1);
}
console.log('\ntheme tokens ok');
