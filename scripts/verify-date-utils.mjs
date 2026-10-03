/**
 * Self-check for local date utilities (NF-05, plan 01-03 Task 1).
 *
 * No test runner exists in this repo (see PLANNING-CONVENTIONS.md §1), so this
 * co-located script asserts the contract by reading `src/utils/dates.ts`
 * as text plus runtime behavior checks (dayjs is pure JS, importable in node).
 *
 * Run: `node scripts/verify-date-utils.mjs`
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PATH = new URL('../src/utils/dates.ts', import.meta.url);
const src = readFileSync(PATH, 'utf8');

const uncommented = src
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('//'))
  .join('\n');

// 1. Negative gate: no UTC conversion anywhere (T-03-01).
assert.ok(!uncommented.includes('toISOString'), 'dates.ts must not use toISOString (UTC drift risk)');
assert.ok(!uncommented.includes('toUTCString'), 'dates.ts must not use toUTCString');
assert.ok(!uncommented.includes('getUTC'), 'dates.ts must not use getUTC* methods');

// 2. Built on dayjs, local formatting.
assert.ok(uncommented.includes("from 'dayjs'"), 'expected dayjs import');
assert.ok(
  uncommented.includes("dayjs().format('YYYY-MM-DD')"),
  "expected local todayKey implementation dayjs().format('YYYY-MM-DD')",
);

// 3. All five helpers exported with exact names.
for (const fn of ['todayKey', 'toDateKey', 'addDays', 'formatDisplay', 'lastNDays']) {
  assert.ok(new RegExp(`export\\s+function\\s+${fn}\\b`).test(uncommented), `expected export function ${fn}`);
}

// 4. Runtime behavior (local keys, deterministic arithmetic).
const mod = await import(PATH);

assert.match(mod.todayKey(), /^\d{4}-\d{2}-\d{2}$/, 'todayKey() must be YYYY-MM-DD');
assert.equal(mod.todayKey(), mod.toDateKey(new Date()), 'todayKey() must equal toDateKey(new Date())');
assert.equal(mod.toDateKey(new Date(2026, 0, 31)), '2026-01-31', 'local month is zero-padded');
assert.equal(mod.addDays('2026-01-31', 1), '2026-02-01', 'addDays crosses month boundary');
assert.equal(mod.addDays('2026-03-01', -1), '2026-02-28', 'addDays handles negative offset');

const last3 = mod.lastNDays(3);
assert.equal(last3.length, 3, 'lastNDays(3) returns 3 keys');
assert.deepEqual([...last3].sort(), last3, 'lastNDays returns ascending keys');
assert.equal(last3[2], mod.todayKey(), 'lastNDays ends at todayKey()');

assert.equal(mod.formatDisplay('2026-10-03'), '03 Oct 2026', "default format is 'DD MMM YYYY'");

console.log('date utils ok');
