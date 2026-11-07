import dayjs from 'dayjs';
import { utils as xlsxUtils, write as writeXlsx } from 'xlsx';

import { CYCLE, STATUS } from '@/constants/status';
import type { AttendanceStatus } from '@/db/types';
import { summarize } from '@/utils/attendance';
import { formatDisplay } from '@/utils/dates';
import { listDatesInRange } from '@/utils/reports';

/**
 * Pure CSV/XLSX/PDF serializers for export (EX-01, EX-02, NF-06).
 *
 * Same purity contract as summarize(): zero runtime `@/db` imports —
 * callers pass entries in, serializers return strings. All filesystem,
 * print, and share I/O lives in `@/utils/files` (reused by Phase 7).
 */

/** One worker-history row for CSV export (EX-01). Date is a local YYYY-MM-DD key. */
export interface WorkerCsvEntry {
  date: string;
  status: AttendanceStatus;
  note: string | null;
}

/** One complete worker row for the worksite-month register matrix (EX-02). */
export interface RegisterWorkerRow {
  workerName: string;
  entries: WorkerCsvEntry[];
}

export interface RegisterMatrixInput {
  from: string;
  to: string;
  workers: RegisterWorkerRow[];
}

/**
 * RFC-4180 strict field escaping (D-17) + spreadsheet formula-injection
 * guard (T-06-01).
 *
 * Fields containing `,`, `"`, `\n`, or `\r` are wrapped in `"` with every
 * `"` doubled. Then, when the ORIGINAL field is longer than 1 char and
 * starts with `=`, `+`, `-`, or `@`, a single-quote prefix forces
 * spreadsheet apps to treat the cell as literal text. The length-1
 * exemption keeps the D-18 `-` note placeholder exact.
 */
export function escapeCsvField(field: string): string {
  let out = field;
  if (out.includes(',') || out.includes('"') || out.includes('\n') || out.includes('\r')) {
    out = `"${out.replace(/"/g, '""')}"`;
  }
  const first = field.charAt(0);
  if (field.length > 1 && (first === '=' || first === '+' || first === '-' || first === '@')) {
    out = `'${out}`;
  }
  return out;
}

function compareDateAsc(a: { date: string }, b: { date: string }): number {
  if (a.date < b.date) {
    return -1;
  }
  if (a.date > b.date) {
    return 1;
  }
  return 0;
}

/** Basic ISO stays readable in a spreadsheet's fixed default CSV column width. */
function csvDate(date: string): string {
  return date.replace(/-/g, '');
}

function xlsxDate(date: string): string {
  return date.replace(/-/g, '/');
}

function workbookBase64(rows: string[][], columnWidths: number[], sheetName: string): string {
  const worksheet = xlsxUtils.aoa_to_sheet(rows);
  worksheet['!cols'] = columnWidths.map((wch) => ({ wch }));
  const workbook = xlsxUtils.book_new();
  xlsxUtils.book_append_sheet(workbook, worksheet, sheetName);
  return writeXlsx(workbook, {
    bookType: 'xlsx',
    type: 'base64',
    cellStyles: true,
    compression: true,
  });
}

const STATUS_CODE: Record<AttendanceStatus, string> = {
  present: 'P',
  absent: 'A',
  half_day: 'H',
  off_day: 'O',
};

interface RegisterMatrixRow {
  date: string;
  cells: (WorkerCsvEntry | null)[];
}

interface RegisterMatrix {
  workerNames: string[];
  rows: RegisterMatrixRow[];
}

function statusCode(status: AttendanceStatus): string {
  return (STATUS_CODE as Record<string, string>)[status] ?? status;
}

/** Complete the sparse attendance entries into one cell per worker/date. */
function registerMatrix(input: RegisterMatrixInput): RegisterMatrix {
  const workers = [...input.workers]
    .sort((a, b) => a.workerName.localeCompare(b.workerName))
    .map((worker) => ({
      workerName: worker.workerName,
      entriesByDate: new Map(worker.entries.map((entry) => [entry.date, entry])),
    }));
  return {
    workerNames: workers.map((worker) => worker.workerName),
    rows: listDatesInRange(input.from, input.to).map((date) => ({
      date,
      cells: workers.map((worker) => worker.entriesByDate.get(date) ?? null),
    })),
  };
}

function registerCellText(entry: WorkerCsvEntry | null): string {
  if (entry === null) {
    return '-';
  }
  const code = statusCode(entry.status);
  return entry.note === null || entry.note === '' ? code : `${code} (${entry.note})`;
}

/** Missing-note placeholder for the worker-history CSV (D-18). */
function noteOrDash(note: string | null): string {
  return note === null || note === '' ? '-' : note;
}

/**
 * Worker-history CSV (EX-01): header `date,status,note`, rows sorted by
 * date ASC. Dates use basic ISO `YYYYMMDD`, which remains readable in
 * spreadsheet apps without overflowing their fixed default CSV column width.
 * Status is the raw lowercase machine key (D-08); missing notes write exactly
 * `-` (D-18). No summary rows (D-06). CRLF joins (RFC-4180), no trailing
 * newline. A UTF-8 BOM opens the file so desktop Excel renders non-ASCII
 * names/notes correctly (Sheets sniffs UTF-8 either way).
 */
export function buildWorkerCsv(entries: WorkerCsvEntry[]): string {
  const sorted = [...entries].sort(compareDateAsc);
  const lines = ['date,status,note'];
  for (const entry of sorted) {
    lines.push([csvDate(entry.date), entry.status, noteOrDash(entry.note)].map(escapeCsvField).join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Worksite-month register CSV (EX-02): dates are rows and workers are
 * columns. Cells use compact P/A/H/O codes, `-` when unmarked, and append an
 * optional note in parentheses. Dates and worker names sort ascending.
 */
export function buildRegisterCsv(input: RegisterMatrixInput): string {
  const matrix = registerMatrix(input);
  const lines = [
    ['DATE', ...matrix.workerNames].map(escapeCsvField).join(','),
  ];
  for (const row of matrix.rows) {
    lines.push(
      [csvDate(row.date), ...row.cells.map(registerCellText)].map(escapeCsvField).join(','),
    );
  }
  return '\uFEFF' + lines.join('\r\n');
}

/** Worker-history XLSX with exact slash dates and a width that shows them in full. */
export function buildWorkerXlsx(entries: WorkerCsvEntry[]): string {
  const rows = [
    ['date', 'status', 'note'],
    ...[...entries]
      .sort(compareDateAsc)
      .map((entry) => [xlsxDate(entry.date), entry.status, noteOrDash(entry.note)]),
  ];
  return workbookBase64(rows, [12, 12, 32], 'Attendance');
}

/** Worksite-month XLSX using the same completed matrix as CSV/PDF. */
export function buildRegisterXlsx(input: RegisterMatrixInput): string {
  const matrix = registerMatrix(input);
  const rows = [
    ['DATE', ...matrix.workerNames],
    ...matrix.rows.map((row) => [xlsxDate(row.date), ...row.cells.map(registerCellText)]),
  ];
  const workerWidths = matrix.workerNames.map((name) => Math.max(10, Math.min(32, name.length + 2)));
  return workbookBase64(rows, [12, ...workerWidths], 'Register');
}

/**
 * Lowercase slug for filenames (D-14). Allowlist `[a-z0-9]+` joined by
 * `-`; path characters can never survive, so `../x` traversal input
 * collapses to a harmless slug (T-06-02).
 */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

export type ExportExtension = 'csv' | 'xlsx' | 'pdf';

/** `hazra-worker-{slug}-{yyyymmdd}.csv|xlsx|pdf` (D-14). `ymd` is a local YYYY-MM-DD key. */
export function workerFilename(workerName: string, ymd: string, ext: ExportExtension): string {
  return `hazra-worker-${slugify(workerName)}-${ymd.replace(/-/g, '')}.${ext}`;
}

/** `hazra-register-{siteslug}-{yyyymm}.csv|xlsx|pdf` (D-14). `month` is a local YYYY-MM key. */
export function registerFilename(siteName: string, month: string, ext: ExportExtension): string {
  return `hazra-register-${slugify(siteName)}-${month.replace('-', '')}.${ext}`;
}

/**
 * Month scope for the register query: `from` is `${month}-01`, `to` is the
 * last calendar day of that month. Local keys only, never toISOString.
 */
export function monthRange(month: string): { from: string; to: string } {
  const from = `${month}-01`;
  const to = dayjs(from).endOf('month').format('YYYY-MM-DD');
  return { from, to };
}

/** Human month label, e.g. `October 2026`. */
export function monthLabel(month: string): string {
  return formatDisplay(`${month}-01`, 'MMMM YYYY');
}

/**
 * HTML-escape for PDF interpolation (T-06-03, note XSS). Applied to EVERY
 * interpolated value in the PDF builders below — names, notes, dates,
 * labels, summary, legend.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Theme passed in by the screen from live `useTheme()` values (D-19).
 * Builders never import theme hooks and never hardcode chrome hex — table
 * and cell colors come ONLY from here. The only other color literals in
 * the generated HTML are `STATUS` solid/tint/text values (DS-01 status
 * contract).
 */
export interface PdfTheme {
  background: string;
  surface: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  primary: string;
}

/**
 * Footer summary line from the ONE % definition (D-20): reuses
 * `summarize()` so export footers can never drift from profile/reports math.
 */
export function footerSummary(entries: Pick<{ status: AttendanceStatus }, 'status'>[]): string {
  const s = summarize(entries);
  return `${s.present} present · ${s.absent} absent · ${s.half_day} half day · ${s.off_day} off day · ${s.percentage === null ? '—' : `${s.percentage}%`}`;
}

const STATUS_KEYS = [...CYCLE] as AttendanceStatus[];

function pdfCellStyle(theme: PdfTheme): string {
  return `border:1px solid ${theme.border};padding:8px;text-align:left;`;
}

/** Legend row: all 4 STATUS entries, solid-color dot + label text (never color alone). */
function legendRow(theme: PdfTheme, columns: number): string {
  const items = STATUS_KEYS.map((key) => {
    const chip = STATUS[key];
    return `<span style="display:inline-block;width:8px;height:8px;border-radius:4px;background-color:${chip.solid};"></span> ${escapeHtml(chip.label)}`;
  }).join(' &nbsp;·&nbsp; ');
  return `<tr><td colspan="${columns}" style="${pdfCellStyle(theme)}color:${escapeHtml(theme.mutedForeground)};">${items}</td></tr>`;
}

function pdfShell(args: {
  title: string;
  subtitle: string | null;
  headerCells: string[];
  bodyRows: string;
  summary: string;
  theme: PdfTheme;
}): string {
  const theme = args.theme;
  const headers = args.headerCells
    .map((h) => `<th style="${pdfCellStyle(theme)}background-color:${theme.surface};color:${escapeHtml(theme.foreground)};">${h}</th>`)
    .join('');
  const subtitle =
    args.subtitle === null
      ? ''
      : `<p style="color:${escapeHtml(theme.mutedForeground)};">${escapeHtml(args.subtitle)}</p>`;
  return (
    `<html><head><meta charset="utf-8" /></head>` +
    `<body style="background-color:${theme.background};color:${escapeHtml(theme.foreground)};font-family:sans-serif;">` +
    `<h1 style="border-bottom:2px solid ${theme.primary};padding-bottom:8px;">${escapeHtml(args.title)}</h1>` +
    subtitle +
    `<table style="width:100%;border-collapse:collapse;background-color:${theme.surface};"><thead><tr>${headers}</tr></thead>` +
    `<tbody>${args.bodyRows}${legendRow(theme, args.headerCells.length)}</tbody></table>` +
    `<p style="color:${escapeHtml(theme.mutedForeground)};">${escapeHtml(args.summary)}</p>` +
    `</body></html>`
  );
}

/**
 * Worker-history PDF table (EX-01): title line, column headers, one row per
 * entry (date via `formatDisplay`, STATUS label text, note or `—`), footer
 * summary from `footerSummary()`, STATUS legend row. Sorted by date ASC
 * like the CSV.
 */
export function buildWorkerPdfHtml(args: {
  title: string;
  entries: WorkerCsvEntry[];
  theme: PdfTheme;
}): string {
  const sorted = [...args.entries].sort(compareDateAsc);
  const bodyRows = sorted
    .map((entry) => {
      // WR-05: degrade gracefully on unknown status keys (future
      // migration / corrupt row) instead of throwing TypeError — the
      // CSV path already writes the raw key.
      const chip = STATUS[entry.status] ?? { label: entry.status, solid: '#808080' };
      const note = entry.note === null || entry.note === '' ? '—' : escapeHtml(entry.note);
      return (
        `<tr>` +
        `<td style="${pdfCellStyle(args.theme)}">${escapeHtml(formatDisplay(entry.date))}</td>` +
        `<td style="${pdfCellStyle(args.theme)}"><span style="display:inline-block;width:8px;height:8px;border-radius:4px;background-color:${chip.solid};"></span> ${escapeHtml(chip.label)}</td>` +
        `<td style="${pdfCellStyle(args.theme)}">${note}</td>` +
        `</tr>`
      );
    })
    .join('');
  return pdfShell({
    title: args.title,
    subtitle: null,
    headerCells: ['Date', 'Status', 'Note'],
    bodyRows,
    summary: footerSummary(sorted),
    theme: args.theme,
  });
}

/**
 * Worksite-month register PDF matrix (EX-02): inclusive date rows, worker
 * columns, compact status cells, weekend distinction, and a landscape page.
 */
export function buildRegisterPdfHtml(args: {
  title: string;
  subtitle: string;
  theme: PdfTheme;
} & RegisterMatrixInput): string {
  const matrix = registerMatrix(args);
  const theme = args.theme;
  const border = escapeHtml(theme.border);
  const surface = escapeHtml(theme.surface);
  const background = escapeHtml(theme.background);
  const foreground = escapeHtml(theme.foreground);
  const mutedForeground = escapeHtml(theme.mutedForeground);
  const primary = escapeHtml(theme.primary);
  const compactCell = `border:1px solid ${border};padding:3px 2px;text-align:center;font-size:8px;overflow-wrap:anywhere;`;
  const weekend = (date: string): boolean => {
    const day = dayjs(date).day();
    return day === 0 || day === 6;
  };
  const workerHeaders = matrix.workerNames
    .map(
      (workerName) =>
        `<th scope="col" style="${compactCell}background-color:${surface};color:${foreground};overflow-wrap:anywhere;">${escapeHtml(workerName)}</th>`,
    )
    .join('');
  const bodyRows = matrix.rows
    .map((row) => {
      const isWeekend = weekend(row.date);
      const cells = row.cells
        .map((entry) => {
          if (entry === null) {
            return `<td data-date="${escapeHtml(row.date)}" data-weekend="${isWeekend}" style="${compactCell}background-color:${isWeekend ? background : surface};color:${mutedForeground};">—</td>`;
          }
          // WR-05: degrade gracefully on a future/corrupt status key.
          const chip = STATUS[entry.status] ?? {
            label: entry.status,
            solid: '#808080',
            tint: theme.surface,
            text: theme.foreground,
          };
          const note =
            entry.note === null || entry.note === ''
              ? ''
              : `<br /><span style="font-size:6px;font-weight:400;white-space:pre-wrap;">${escapeHtml(entry.note)}</span>`;
          return (
            `<td data-date="${escapeHtml(row.date)}" data-weekend="${isWeekend}" style="${compactCell}background-color:${escapeHtml(chip.tint)};color:${escapeHtml(chip.text)};font-weight:700;">` +
            `${escapeHtml(statusCode(entry.status))}${note}</td>`
          );
        })
        .join('');
      return (
        `<tr data-date="${escapeHtml(row.date)}" data-weekend="${isWeekend}" style="break-inside:avoid;">` +
        `<th scope="row" style="border:1px solid ${border};width:64px;padding:4px;text-align:left;background-color:${isWeekend ? background : surface};color:${foreground};font-size:8px;">` +
        `<span>${escapeHtml(formatDisplay(row.date, 'DD'))}</span><br />` +
        `<span style="color:${mutedForeground};font-weight:400;">${escapeHtml(formatDisplay(row.date, 'ddd'))}</span></th>` +
        cells +
        `</tr>`
      );
    })
    .join('');
  const legend = STATUS_KEYS.map((key) => {
    const chip = STATUS[key];
    return `<span style="white-space:nowrap;color:${escapeHtml(chip.text)};">${escapeHtml(`${statusCode(key)} = ${chip.label}`)}</span>`;
  }).join(' &nbsp;·&nbsp; ');
  const visibleEntries = matrix.rows.flatMap((row) =>
    row.cells.filter((entry): entry is WorkerCsvEntry => entry !== null),
  );
  const columns = matrix.workerNames.length + 1;
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width,initial-scale=1" />` +
    `<style>@page{size:landscape;margin:8mm;}thead{display:table-header-group;}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;}</style>` +
    `</head><body style="margin:0;background-color:${background};color:${foreground};font-family:sans-serif;">` +
    `<h1 style="margin:0 0 4px;border-bottom:2px solid ${primary};padding-bottom:4px;font-size:16px;">${escapeHtml(args.title)}</h1>` +
    `<p style="margin:0 0 8px;color:${mutedForeground};font-size:9px;">${escapeHtml(args.subtitle)}</p>` +
    `<table style="width:100%;border-collapse:collapse;table-layout:fixed;background-color:${surface};">` +
    `<thead><tr><th style="border:1px solid ${border};width:64px;padding:4px;text-align:left;background-color:${surface};color:${foreground};font-size:8px;">DATE</th>${workerHeaders}</tr></thead>` +
    `<tbody>${bodyRows}<tr><td colspan="${columns}" style="border:1px solid ${border};padding:5px;font-size:8px;">${legend}</td></tr></tbody>` +
    `</table><p style="margin:6px 0 0;color:${mutedForeground};font-size:8px;">${escapeHtml(footerSummary(visibleEntries))}</p>` +
    `</body></html>`
  );
}
