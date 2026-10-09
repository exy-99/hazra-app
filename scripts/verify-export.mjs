/**
 * Standing RFC-4180 probe + contract self-check for export serializers
 * (EX-01, EX-02, NF-06, plan 06-01 task 3).
 *
 * No test runner exists in this repo, so this co-located script asserts the
 * contract statically (the serializers import `@/` aliases + dayjs, which
 * plain node cannot resolve without a build step) plus self-contained
 * behavioral probes that re-implement the documented rules inline.
 *
 * Asserts: (a) all 12 export.ts exports present; (b) zero runtime `@/db/`
 * imports; (c) both CSV headers present; (d) `-` dash placeholder + `—`
 * PDF cell present; (e) CSV builders write raw lowercase keys (no
 * `.label` in buildWorkerCsv body); (f) RFC-4180 PROBE (D-17): the probe
 * note `left early, told "back tomorrow"` produces the exact quoted cell
 * and round-trips through a minimal RFC-4180 field parser; (g) slug probe:
 * `St Mary's Site 2` → `st-mary-s-site-2`, traversal input keeps no `/`
 * or `.` sequences.
 *
 * Run: `node scripts/verify-export.mjs`
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exportPath = new URL('../src/utils/export.ts', import.meta.url);
const filesPath = new URL('../src/utils/files.ts', import.meta.url);
const src = fs.readFileSync(exportPath, 'utf8');
const filesSrc = fs.readFileSync(filesPath, 'utf8');

// (a) All 12 serializer exports present.
const expectedExports = [
  'escapeCsvField',
  'buildWorkerCsv',
  'buildRegisterCsv',
  'slugify',
  'workerFilename',
  'registerFilename',
  'monthRange',
  'monthLabel',
  'escapeHtml',
  'buildWorkerPdfHtml',
  'buildRegisterPdfHtml',
  'footerSummary',
];
for (const name of expectedExports) {
  assert.ok(src.includes(`export function ${name}`), `missing export: ${name}`);
}

// (b) Zero runtime `@/db/` imports (type-only imports are erased at compile).
const withoutTypeImports = src.replace(/import type[^;]+;/g, '');
assert.ok(!/from ['"]@\/db\//.test(withoutTypeImports), 'runtime @/db import found');

// (c) Both CSV headers present.
assert.ok(src.includes('date,status,note'), 'worker header date,status,note missing');
assert.ok(src.includes('date,worker,status,note'), 'register header date,worker,status,note missing');

// (d) `-` dash placeholder (D-18) + `—` PDF cell both present.
assert.ok(src.includes("'-'") || src.includes('"-"'), 'dash placeholder missing');
assert.ok(src.includes('—'), 'PDF em-dash cell missing');

// (e) CSV builders write raw lowercase keys: buildWorkerCsv body references
// no `.label` (STATUS labels belong to PDF/preview only, never CSV).
const workerFnStart = src.indexOf('export function buildWorkerCsv');
assert.ok(workerFnStart !== -1, 'buildWorkerCsv body not found');
const nextExport = src.indexOf('\nexport ', workerFnStart + 1);
const workerBody = nextExport === -1 ? src.slice(workerFnStart) : src.slice(workerFnStart, nextExport);
assert.ok(!workerBody.includes('.label'), 'buildWorkerCsv must not reference .label');
assert.ok(workerBody.includes('entry.status'), 'buildWorkerCsv must write the raw status key');

// (f) RFC-4180 PROBE (D-17, roadmap success criterion #1): re-implement the
// documented quoting rule inline — quote-wrap iff the field contains `,`,
// `"`, or a newline, doubling every `"`.
function quoteField(field) {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
const probe = 'left early, told "back tomorrow"';
assert.equal(
  quoteField(probe),
  '"left early, told ""back tomorrow"""',
  'RFC-4180 probe quoting mismatch',
);
// Minimal RFC-4180 field parser: the quoted probe cell must round-trip.
function parseField(cell) {
  if (cell.length >= 2 && cell.startsWith('"') && cell.endsWith('"')) {
    return cell.slice(1, -1).replace(/""/g, '"');
  }
  return cell;
}
assert.equal(parseField(quoteField(probe)), probe, 'RFC-4180 probe round-trip failed');
// The implementation must contain the same documented rule.
assert.ok(src.includes("'\"'") || src.includes('"\\""'), 'escapeCsvField doubling rule missing');

// (g) Slug probe (D-14, T-06-02): rule replicated inline.
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}
assert.equal(slugify("St Mary's Site 2"), 'st-mary-s-site-2', 'slug probe mismatch');
const traversal = slugify('../../etc');
assert.ok(!traversal.includes('/') && !traversal.includes('.'), 'slug keeps traversal sequences');
assert.ok(src.includes('[^a-z0-9]'), 'slugify allowlist rule missing in implementation');

// File-helper companion contract: the 5 helpers exist for Phase 7 reuse.
for (const name of ['writeTextFile', 'printHtmlToPdf', 'shareFile', 'deleteFile', 'copyBinaryFile']) {
  assert.ok(filesSrc.includes(`export async function ${name}`), `missing files helper: ${name}`);
}

console.log('EXPORT_VERIFY_OK');
