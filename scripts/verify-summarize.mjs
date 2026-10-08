/**
 * Runtime hand-check for summarize() (PR-02, plan 04-01 task 2).
 *
 * No test runner exists in this repo, so this co-located script asserts the
 * contract by direct node import (type-stripping, dates precedent).
 *
 * Run: `node scripts/verify-summarize.mjs`
 */
import assert from 'node:assert/strict';

const PATH = new URL('../src/utils/attendance.ts', import.meta.url);
const mod = await import(PATH);

const { summarize, ATTENDANCE_PCT_FLOOR } = mod;
assert.equal(typeof summarize, 'function', 'expected summarize export');
assert.equal(ATTENDANCE_PCT_FLOOR, 75, 'ATTENDANCE_PCT_FLOOR must be 75');

// 1. Roadmap hand-check vector: 20 present + 5 absent + 3 half_day + 2 off_day.
const vector = [
  ...Array.from({ length: 20 }, () => ({ status: 'present' })),
  ...Array.from({ length: 5 }, () => ({ status: 'absent' })),
  ...Array.from({ length: 3 }, () => ({ status: 'half_day' })),
  ...Array.from({ length: 2 }, () => ({ status: 'off_day' })),
];
const s = summarize(vector);
assert.equal(s.present, 20, 'present count');
assert.equal(s.absent, 5, 'absent count');
assert.equal(s.half_day, 3, 'half_day count');
assert.equal(s.off_day, 2, 'off_day count');
assert.equal(s.denominator, 28, 'denominator excludes off_day');
assert.equal(s.percentage, 76.79, 'percentage must read exactly 76.79');

// 2. Zero-denominator cases → null, never 0/NaN.
assert.equal(summarize([]).percentage, null, 'empty array → null');
const offOnly = summarize([{ status: 'off_day' }, { status: 'off_day' }]);
assert.equal(offOnly.denominator, 0, 'off_day-only denominator is 0');
assert.equal(offOnly.percentage, null, 'off_day-only → null');

// 3. half_day weighting — single half_day → denominator 1, 50%.
const half = summarize([{ status: 'half_day' }]);
assert.equal(half.denominator, 1, 'single half_day denominator is 1');
assert.equal(half.percentage, 50, 'single half_day → 50%');

// 5. off_day never inflates the denominator.
const mixed = summarize([{ status: 'present' }, { status: 'off_day' }]);
assert.equal(mixed.denominator, 1, '1 present + 1 off_day → denominator 1');
assert.equal(mixed.percentage, 100, '1 present + 1 off_day → 100%');

console.log('summarize ok');
