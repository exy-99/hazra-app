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
 * Asserts: (a) all export.ts exports present; (b) zero runtime `@/db/`
 * imports; (c) worker-history + register-matrix CSV headers present; (d) `-` dash placeholder + `—`
 * PDF cell present; (e) CSV builders write raw lowercase keys (no
 * `.label` in buildWorkerCsv body); (f) RFC-4180 PROBE (D-17, roadmap
 * success criterion #1) against the REAL escapeCsvField + round-trip
 * through a minimal RFC-4180 field parser; (g) slug probe against the
 * REAL slugify; (h) real-module probes: T-06-01 formula guard (incl. the
 * length-1 `-` exemption), UTF-8 BOM (WR-03), complete register matrix,
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
import { read as readXlsx, utils as xlsxUtils } from 'xlsx';

const exportPath = new URL('../src/utils/export.ts', import.meta.url);
const filesPath = new URL('../src/utils/files.ts', import.meta.url);
const screenPath = new URL('../src/app/export.tsx', import.meta.url);
const src = fs.readFileSync(exportPath, 'utf8');
const filesSrc = fs.readFileSync(filesPath, 'utf8');
const screenSrc = fs.readFileSync(screenPath, 'utf8');

// (a) All serializer exports present.
const expectedExports = [
  'escapeCsvField',
  'buildWorkerCsv',
  'buildRegisterCsv',
  'buildWorkerXlsx',
  'buildRegisterXlsx',
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

// (c) Worker-history + worksite matrix CSV headers present.
assert.ok(src.includes('date,status,note'), 'worker header date,status,note missing');
assert.ok(src.includes("['DATE', ...matrix.workerNames]"), 'register DATE/employee header missing');
assert.ok(screenSrc.includes("{ key: 'xlsx', label: 'XLSX' }"), 'XLSX format chip missing');
assert.match(
  screenSrc,
  /useState<ExportExtension>\('xlsx'\)/,
  'XLSX must be the default so one-tap exports keep YYYY/MM/DD dates',
);
for (const name of ['buildWorkerXlsx', 'buildRegisterXlsx', 'writeBase64File']) {
  assert.ok(screenSrc.includes(name), `export screen missing XLSX integration: ${name}`);
}

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
  stage('src/utils/reports.ts', 'reports.ts');
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
  assert.equal(wlines[1], '20261005,present,-', 'worker date must use compact ISO');
  const wxlsx = exp.buildWorkerXlsx([
    { date: '2026-10-05', status: 'present', note: '=SUM(1+1)' },
    { date: '2026-10-28', status: 'absent', note: 'Sick' },
  ]);
  assert.equal(Buffer.from(wxlsx, 'base64').subarray(0, 2).toString(), 'PK', 'worker XLSX is not a ZIP workbook');
  const wbook = readXlsx(wxlsx, { type: 'base64', cellStyles: true });
  const wsheet = wbook.Sheets[wbook.SheetNames[0]];
  const wrows = xlsxUtils.sheet_to_json(wsheet, { header: 1, raw: true });
  assert.deepEqual(wrows[1], ['2026/10/05', 'present', '=SUM(1+1)'], 'worker XLSX row wrong');
  assert.deepEqual(wrows[2], ['2026/10/28', 'absent', 'Sick'], 'worker XLSX slash date wrong');
  assert.ok(wsheet['!cols']?.[0]?.wch >= 12, 'worker XLSX date column too narrow');
  assert.equal(wsheet.C2.f, undefined, 'worker XLSX note became an executable formula');
  // Formula guard + sorting flow through the real builder.
  const fcsv = exp.buildWorkerCsv([
    { date: '2026-10-06', status: 'present', note: 'ok' },
    { date: '2026-10-05', status: 'absent', note: '=SUM(A1:A9)' },
  ]);
  assert.ok(fcsv.includes("'=SUM(A1:A9)"), 'formula guard missing in worker CSV output');
  assert.ok(
    fcsv.indexOf('20261005') < fcsv.indexOf('20261006'),
    'worker CSV not sorted date ASC',
  );
  const registerWorkers = [
    { workerName: 'Zed', entries: [] },
    {
      workerName: 'Asha',
      entries: [
        { date: '2026-10-05', status: 'absent', note: 'x,y' },
        { date: '2026-10-07', status: 'half_day', note: null },
      ],
    },
  ];
  const rcsv = exp.buildRegisterCsv({
    from: '2026-10-05',
    to: '2026-10-07',
    workers: registerWorkers,
  });
  assert.equal(rcsv.charCodeAt(0), 0xfeff, 'register CSV missing UTF-8 BOM');
  const rlines = rcsv.slice(1).split('\r\n');
  assert.equal(
    rlines[0],
    'DATE,Asha,Zed',
    'register must include every worker as a column',
  );
  assert.equal(rlines[1], '20261005,"A (x,y)",-', 'marked/unmarked register cells wrong');
  assert.equal(rlines[2], '20261006,-,-', 'unmarked date row must remain in register');
  assert.equal(rlines[3], '20261007,H,-', 'worker with no marks must remain as a column');
  const rxlsx = exp.buildRegisterXlsx({
    from: '2026-10-05',
    to: '2026-10-07',
    workers: registerWorkers,
  });
  assert.equal(Buffer.from(rxlsx, 'base64').subarray(0, 2).toString(), 'PK', 'register XLSX is not a ZIP workbook');
  const rbook = readXlsx(rxlsx, { type: 'base64', cellStyles: true });
  const rsheet = rbook.Sheets[rbook.SheetNames[0]];
  const rrows = xlsxUtils.sheet_to_json(rsheet, { header: 1, raw: true });
  assert.deepEqual(rrows[0], ['DATE', 'Asha', 'Zed'], 'register XLSX header wrong');
  assert.deepEqual(rrows[1], ['2026/10/05', 'A (x,y)', '-'], 'register XLSX first row wrong');
  assert.deepEqual(rrows[2], ['2026/10/06', '-', '-'], 'register XLSX blank row wrong');
  assert.deepEqual(rrows[3], ['2026/10/07', 'H', '-'], 'register XLSX final row wrong');
  assert.ok(rsheet['!cols']?.[0]?.wch >= 12, 'register XLSX date column too narrow');
  assert.equal(
    exp.workerFilename('Asha', '2026-10-05', 'xlsx'),
    'hazra-worker-asha-20261005.xlsx',
    'worker XLSX filename wrong',
  );
  assert.equal(
    exp.registerFilename('Site One', '2026-10', 'xlsx'),
    'hazra-register-site-one-202610.xlsx',
    'register XLSX filename wrong',
  );

  // monthRange end-of-month math on the REAL function (incl. leap Feb).
  assert.deepEqual(exp.monthRange('2026-10'), { from: '2026-10-01', to: '2026-10-31' });
  assert.deepEqual(exp.monthRange('2024-02'), { from: '2024-02-01', to: '2024-02-29' });
  const fullMonthCsv = exp.buildRegisterCsv({
    ...exp.monthRange('2026-10'),
    workers: [{ workerName: 'Asha', entries: [] }],
  });
  const fullMonthLines = fullMonthCsv.slice(1).split('\r\n');
  assert.equal(fullMonthLines.length, 32, '31-day register row count wrong');
  assert.ok(
    fullMonthLines.every((line) => line.split(',').length === 2),
    'date rows must contain DATE plus every worker column',
  );
  assert.equal(fullMonthLines[1].split(',')[0], '20261001', 'first register date not compact ISO');
  assert.equal(fullMonthLines[31].split(',')[0], '20261031', 'last register date not compact ISO');

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
      from: '2026-10-05',
      to: '2026-10-05',
      workers: [
        {
          workerName: 'Asha',
          entries: [{ date: '2026-10-05', status: 'bogus', note: null }],
        },
      ],
      theme,
    });
  }, 'register PDF threw on unknown status');

  // Register PDF uses the same complete matrix, compact status legend,
  // escaped cell notes, landscape print CSS, and weekend-row distinction.
  const registerHtml = exp.buildRegisterPdfHtml({
    title: 'T',
    subtitle: 'S',
    from: '2026-10-09',
    to: '2026-10-11',
    workers: [
      {
        workerName: 'Asha',
        entries: [{ date: '2026-10-10', status: 'present', note: '<b>hi</b>' }],
      },
      { workerName: 'Zed', entries: [] },
    ],
    theme,
  });
  for (const value of ['DATE', '2026-10-09', '2026-10-10', '2026-10-11', 'Asha', 'Zed']) {
    assert.ok(registerHtml.includes(value), `register PDF matrix missing ${value}`);
  }
  assert.ok(registerHtml.includes('size:landscape'), 'register PDF is not landscape');
  assert.ok(
    registerHtml.includes('data-date="2026-10-10" data-weekend="true"') &&
      registerHtml.includes('data-date="2026-10-11" data-weekend="true"'),
    'register PDF weekend rows are not distinguished',
  );
  assert.ok(
    !registerHtml.includes('<b>hi</b>') && registerHtml.includes('&lt;b&gt;hi&lt;/b&gt;'),
    'register PDF note not escaped',
  );
  for (const code of ['P = Present', 'A = Absent', 'H = Half day', 'O = Off day']) {
    assert.ok(registerHtml.includes(code), `register PDF legend missing ${code}`);
  }

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

// File-helper companion contract: helpers exist for Phase 7 reuse.
for (const name of ['writeTextFile', 'writeBase64File', 'printHtmlToPdf', 'shareFile', 'deleteFile', 'copyBinaryFile']) {
  assert.ok(filesSrc.includes(`export async function ${name}`), `missing files helper: ${name}`);
}
assert.ok(filesSrc.includes('FileSystem.EncodingType.Base64'), 'binary writer is not Base64-safe');

console.log('EXPORT_VERIFY_OK');
