/**
 * Standing RFC-4180 probe + contract self-check for export serializers
 * (EX-01, EX-02, NF-06, plan 06-01 task 3).
 *
 * No test runner exists in this repo. Sections (a)-(g) assert the contract
 * statically; section (h) stages the REAL TypeScript modules into a temp
 * dir inside the repo (so bare `dayjs` resolves from node_modules),
 * rewrites the `@/` aliases to relative `./x.ts` specifiers, and imports
 * them with Node's native type stripping — then runs behavioral probes
 * against the real `escapeCsvField`/`slugify`/builders (WR-04: the probe
 * used to test inline re-implementations, so an implementation regression
 * still printed EXPORT_VERIFY_OK).
 *
 * Asserts: (a) all 12 export.ts exports present; (b) zero runtime `@/db/`
 * imports; (c) both CSV headers present; (d) `-` dash placeholder + `—`
 * PDF cell present; (e) CSV builders write raw lowercase keys (no
 * `.label` in buildWorkerCsv body); (f) RFC-4180 PROBE (D-17, roadmap
 * success criterion #1) against the REAL escapeCsvField + round-trip
 * through a minimal RFC-4180 field parser; (g) slug probe against the
 * REAL slugify; (h) real-module probes: T-06-01 formula guard (incl. the
 * length-1 `-` exemption), UTF-8 BOM (WR-03), register column counts,
 * monthRange end-of-month math (incl. leap Feb), escapeHtml, footerSummary
 * parity with summarize(), PDF escaping, and PDF graceful degradation on
 * unknown status keys (WR-05).
 *
 * Run: `node scripts/verify-export.mjs`
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

// (f) RFC-4180 PROBE (D-17, roadmap success criterion #1) against the REAL
// implementation (staged below): the probe note must come back quoted with
// doubled quotes and round-trip through a minimal RFC-4180 field parser.
// (g) Slug probe (D-14, T-06-02) likewise against the real slugify.

// (h) Stage the real modules and probe them behaviorally (WR-04).
// Temp dir lives INSIDE the repo so bare `dayjs` resolves via node_modules.
const tmp = fs.mkdtempSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp-verify-export-'));
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}');
  const stage = (repoRel, destName) => {
    let code = fs.readFileSync(new URL(`../${repoRel}`, import.meta.url), 'utf8');
    code = code.replace(/^import type[^;]+;/gm, '');
    code = code.replace(/from '@\/([^']+)'/g, (_, p) => `from './${p.split('/').pop()}.ts'`);
    fs.writeFileSync(path.join(tmp, destName), code);
  };
  stage('src/constants/status.ts', 'status.ts');
  stage('src/utils/attendance.ts', 'attendance.ts');
  stage('src/utils/dates.ts', 'dates.ts');
  stage('src/utils/export.ts', 'export.ts');

  const exp = await import(pathToFileURL(path.join(tmp, 'export.ts')).href);
  const att = await import(pathToFileURL(path.join(tmp, 'attendance.ts')).href);

  // (f) REAL RFC-4180 quoting + round-trip.
  const probe = 'left early, told "back tomorrow"';
  assert.equal(
    exp.escapeCsvField(probe),
    '"left early, told ""back tomorrow"""',
    'RFC-4180 probe quoting mismatch (real escapeCsvField)',
  );
  const parseField = (cell) => {
    if (cell.length >= 2 && cell.startsWith('"') && cell.endsWith('"')) {
      return cell.slice(1, -1).replace(/""/g, '"');
    }
    return cell;
  };
  assert.equal(parseField(exp.escapeCsvField(probe)), probe, 'RFC-4180 probe round-trip failed');

  // T-06-01 formula-injection guard on the REAL function, including the
  // length-1 `-` exemption interaction (D-18 placeholder stays exact).
  assert.equal(exp.escapeCsvField('=SUM(1+1)'), "'=SUM(1+1)", 'formula guard missing for =');
  assert.equal(exp.escapeCsvField('+cmd'), "'+cmd", 'formula guard missing for +');
  assert.equal(exp.escapeCsvField('@evil'), "'@evil", 'formula guard missing for @');
  assert.equal(exp.escapeCsvField('-x'), "'-x", 'formula guard missing for -');
  assert.equal(exp.escapeCsvField('-'), '-', 'length-1 - placeholder must stay exact');
  assert.equal(exp.escapeCsvField('plain note'), 'plain note', 'plain field altered');
  assert.ok(src.includes('field.length > 1'), 'formula-guard length check missing in implementation');

  // (g) REAL slugify + traversal collapse.
  assert.equal(exp.slugify("St Mary's Site 2"), 'st-mary-s-site-2', 'slug probe mismatch (real slugify)');
  const traversal = exp.slugify('../../etc');
  assert.ok(!traversal.includes('/') && !traversal.includes('.'), 'slug keeps traversal sequences');

  // WR-03: UTF-8 BOM opens both real CSV outputs (desktop Excel sniffing).
  const wcsv = exp.buildWorkerCsv([{ date: '2026-10-05', status: 'present', note: null }]);
  assert.equal(wcsv.charCodeAt(0), 0xfeff, 'worker CSV missing UTF-8 BOM');
  const wlines = wcsv.slice(1).split('\r\n');
  assert.equal(wlines[0], 'date,status,note', 'worker header wrong');
  assert.equal(wlines[1], '2026-10-05,present,-', 'worker row wrong (dash placeholder?)');
  // Formula guard + sorting flow through the real builder.
  const fcsv = exp.buildWorkerCsv([
    { date: '2026-10-06', status: 'present', note: 'ok' },
    { date: '2026-10-05', status: 'absent', note: '=SUM(A1:A9)' },
  ]);
  assert.ok(fcsv.includes("'=SUM(A1:A9)"), 'formula guard missing in worker CSV output');
  assert.ok(
    fcsv.indexOf('2026-10-05') < fcsv.indexOf('2026-10-06'),
    'worker CSV not sorted date ASC',
  );
  const rcsv = exp.buildRegisterCsv([
    { date: '2026-10-05', workerName: 'Asha', status: 'absent', note: 'x,y' },
  ]);
  assert.equal(rcsv.charCodeAt(0), 0xfeff, 'register CSV missing UTF-8 BOM');
  const rlines = rcsv.slice(1).split('\r\n');
  assert.equal(rlines[0], 'date,worker,status,note', 'register header wrong');
  assert.ok(rlines[1].includes('"x,y"'), 'register comma note not RFC-4180 quoted');
  // Column-count criterion (Excel/Sheets): every register row has 4 fields.
  assert.equal(rlines[1], '2026-10-05,Asha,absent,"x,y"', 'register row shape wrong');

  // monthRange end-of-month math on the REAL function (incl. leap Feb).
  assert.deepEqual(exp.monthRange('2026-10'), { from: '2026-10-01', to: '2026-10-31' });
  assert.deepEqual(exp.monthRange('2024-02'), { from: '2024-02-01', to: '2024-02-29' });

  // escapeHtml on the REAL function.
  assert.equal(
    exp.escapeHtml('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    'escapeHtml mismatch (real)',
  );

  // footerSummary parity with the REAL summarize().
  const entries = [
    { status: 'present' },
    { status: 'present' },
    { status: 'absent' },
    { status: 'half_day' },
    { status: 'off_day' },
  ];
  const s = att.summarize(entries);
  const footer = exp.footerSummary(entries);
  for (const part of [`${s.present} present`, `${s.absent} absent`, `${s.half_day} half day`, `${s.off_day} off day`]) {
    assert.ok(footer.includes(part), `footerSummary drift from summarize(): missing ${part}`);
  }

  // WR-05: PDF builders degrade gracefully on unknown status keys.
  const theme = {
    background: '#ffffff',
    surface: '#f5f5f5',
    foreground: '#111111',
    mutedForeground: '#666666',
    border: '#cccccc',
    primary: '#ff5500',
  };
  let unknownHtml = '';
  assert.doesNotThrow(() => {
    unknownHtml = exp.buildWorkerPdfHtml({
      title: 'T',
      entries: [{ date: '2026-10-05', status: 'bogus', note: null }],
      theme,
    });
  }, 'worker PDF threw on unknown status');
  assert.ok(unknownHtml.includes('bogus'), 'worker PDF dropped the unknown status label');
  assert.doesNotThrow(() => {
    exp.buildRegisterPdfHtml({
      title: 'T',
      subtitle: 'S',
      rows: [{ date: '2026-10-05', workerName: 'Asha', status: 'bogus', note: null }],
      theme,
    });
  }, 'register PDF threw on unknown status');

  // PDF escaping on the REAL builder.
  const pdfEsc = exp.buildWorkerPdfHtml({
    title: 'T',
    entries: [{ date: '2026-10-05', status: 'present', note: '<b>hi</b>' }],
    theme,
  });
  assert.ok(
    !pdfEsc.includes('<b>hi</b>') && pdfEsc.includes('&lt;b&gt;hi&lt;/b&gt;'),
    'PDF note not escaped (real builder)',
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// File-helper companion contract: the 5 helpers exist for Phase 7 reuse.
for (const name of ['writeTextFile', 'printHtmlToPdf', 'shareFile', 'deleteFile', 'copyBinaryFile']) {
  assert.ok(filesSrc.includes(`export async function ${name}`), `missing files helper: ${name}`);
}

console.log('EXPORT_VERIFY_OK');
