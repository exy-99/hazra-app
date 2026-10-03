/**
 * Self-check for the stable ID generator (plan 01-03 Task 2, T-03-02).
 *
 * No test runner exists in this repo (see PLANNING-CONVENTIONS.md §1).
 * `expo-crypto` is a native module and cannot be imported under plain node,
 * so this script asserts the contract by reading `src/utils/ids.ts` as text:
 * the module must use `randomUUID` from `expo-crypto` with no weaker fallback.
 * Runtime behavior (non-empty, unique UUIDv4 strings) is guaranteed by the
 * expo-crypto contract and covered by `npx tsc --noEmit`.
 *
 * Run: `node scripts/verify-ids.mjs`
 */
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PATH = new URL('../src/utils/ids.ts', import.meta.url);
const src = readFileSync(PATH, 'utf8');

const uncommented = src
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('//'))
  .join('\n');

const count = (token) => uncommented.split(token).length - 1;

// 1. Uses Crypto.randomUUID from expo-crypto exactly once each.
assert.equal(count('randomUUID'), 1, `expected randomUUID 1x, found ${count('randomUUID')}`);
assert.equal(count('expo-crypto'), 1, `expected expo-crypto 1x, found ${count('expo-crypto')}`);

// 2. No weaker fallback scheme.
assert.equal(count('Math.random'), 0, 'must not use Math.random');
assert.ok(!uncommented.includes('getRandomBytes'), 'must use randomUUID, not getRandomBytes');
assert.ok(!uncommented.includes('Date.now'), 'must not derive IDs from the clock');

// 3. Exact public surface: export function newId(): string.
assert.ok(
  /export\s+function\s+newId\(\):\s*string/.test(uncommented),
  'expected `export function newId(): string`',
);
assert.ok(/return\s+randomUUID\(\)/.test(uncommented), 'expected `return randomUUID()` body');

console.log('ids ok');
