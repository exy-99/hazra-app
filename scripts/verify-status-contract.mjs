/**
 * Self-check for the attendance status contract (DS-01, design.md §4).
 *
 * No test runner exists in this repo (see PLANNING-CONVENTIONS.md §1), so this
 * co-located script asserts the contract by reading `src/constants/status.ts`
 * as text plus a runtime import check via type-stripped TS.
 *
 * Run: `node scripts/verify-status-contract.mjs`
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PATH = new URL('../src/constants/status.ts', import.meta.url);
const src = readFileSync(PATH, 'utf8');

const uncommented = src
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('//'))
  .join('\n');

// 1. STATUS solid hexes (design.md §4).
// Note: #B45309 is both the half_day solid AND text color per design.md §4,
// so it appears twice; the other solids appear once each.
const solidExpectations = [
  ['#16A34A', 1],
  ['#DC2626', 1],
  ['#B45309', 2],
  ['#64748B', 1],
];
for (const [hex, expected] of solidExpectations) {
  const count = uncommented.split(hex).length - 1;
  assert.equal(count, expected, `expected solid hex ${hex} ${expected}x in code, found ${count}`);
}

// 2. STATUS tint/text hexes present.
for (const hex of ['#DCFCE7', '#15803D', '#FEE2E2', '#B91C1C', '#FEF3C7', '#E2E8F0', '#475569']) {
  assert.ok(uncommented.includes(hex), `expected tint/text hex ${hex} in status.ts`);
}

// 3. All four status keys + labels.
for (const key of ['present', 'absent', 'half_day', 'off_day']) {
  assert.ok(new RegExp(`\\b${key}\\b`).test(uncommented), `expected status key ${key}`);
}
for (const label of ["'Present'", "'Absent'", "'Half day'", "'Off day'"]) {
  assert.ok(uncommented.includes(label), `expected label ${label}`);
}

// 4. CYCLE order used by the tap-to-cycle pill (design.md §7.2).
const cycleMatch = uncommented.match(/CYCLE\s*=\s*\[(.*?)\]/s);
assert.ok(cycleMatch, 'expected exported CYCLE array');
const cycleKeys = [...cycleMatch[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
assert.deepEqual(cycleKeys, ['present', 'absent', 'half_day', 'off_day']);

// 5. Shape: exactly four STATUS entries, each with label/solid/tint/text.
const statusBlock = uncommented.match(/STATUS\s*=\s*\{(.*?)\}\s*as const/s);
assert.ok(statusBlock, 'expected exported STATUS as const object');
const entryMatches = [...statusBlock[1].matchAll(/\{\s*label:\s*'[^']*',\s*solid:\s*'[^']*',\s*tint:\s*'[^']*',\s*text:\s*'[^']*'\s*\}/g)];
assert.equal(entryMatches.length, 4, `expected 4 status entries, found ${entryMatches.length}`);

// 6. Canonical union export.
assert.ok(/export\s+type\s+AttendanceStatus\s*=\s*keyof\s+typeof\s+STATUS/.test(uncommented), 'expected canonical AttendanceStatus union');

// 7. Runtime check: every STATUS entry has exactly { label, solid, tint, text }.
const mod = await import(PATH);
assert.deepEqual(Object.keys(mod.STATUS).sort(), ['absent', 'half_day', 'off_day', 'present']);
assert.deepEqual([...mod.CYCLE], ['present', 'absent', 'half_day', 'off_day']);
for (const [key, value] of Object.entries(mod.STATUS)) {
  assert.deepEqual(Object.keys(value).sort(), ['label', 'solid', 'text', 'tint'], `STATUS.${key} has unexpected keys`);
}
assert.ok(['present', 'absent', 'half_day', 'off_day'].includes('present'));
assert.equal(mod.STATUS.present.solid, '#16A34A');
assert.equal(mod.STATUS.present.tint, '#DCFCE7');
assert.equal(mod.STATUS.present.text, '#15803D');
assert.equal(mod.STATUS.absent.solid, '#DC2626');
assert.equal(mod.STATUS.half_day.solid, '#B45309');
assert.equal(mod.STATUS.off_day.solid, '#64748B');

console.log('status contract ok');
