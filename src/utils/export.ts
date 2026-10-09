import dayjs from 'dayjs';

import { CYCLE, STATUS } from '@/constants/status';
import type { AttendanceStatus } from '@/db/types';
import { summarize } from '@/utils/attendance';
import { formatDisplay } from '@/utils/dates';

/**
 * Pure CSV/PDF serializers for Phase 6 export (EX-01, EX-02, NF-06).
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

/** One worksite-month register row for CSV export (EX-02). */
export interface RegisterCsvRow {
  date: string;
  workerName: string;
  status: AttendanceStatus;
  note: string | null;
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

/** Missing-note placeholder shared by both CSV builders (D-18). */
function noteOrDash(note: string | null): string {
  return note === null || note === '' ? '-' : note;
}

/**
 * Worker-history CSV (EX-01): header `date,status,note`, rows sorted by
 * date ASC. Status is the raw lowercase machine key (D-08); missing notes
 * write exactly `-` (D-18). No summary rows (D-06). CRLF joins (RFC-4180),
 * no trailing newline.
 */
export function buildWorkerCsv(entries: WorkerCsvEntry[]): string {
  const sorted = [...entries].sort(compareDateAsc);
  const lines = ['date,status,note'];
  for (const entry of sorted) {
    lines.push([entry.date, entry.status, noteOrDash(entry.note)].map(escapeCsvField).join(','));
  }
  return lines.join('\r\n');
}

/**
 * Worksite-month register CSV (EX-02): header `date,worker,status,note`,
 * rows sorted by date ASC then worker name. Same lowercase keys, same `-`
 * note rule, same escaping and CRLF join as the worker CSV.
 */
export function buildRegisterCsv(rows: RegisterCsvRow[]): string {
  const sorted = [...rows].sort(
    (a, b) => compareDateAsc(a, b) || a.workerName.localeCompare(b.workerName),
  );
  const lines = ['date,worker,status,note'];
  for (const row of sorted) {
    lines.push(
      [row.date, row.workerName, row.status, noteOrDash(row.note)].map(escapeCsvField).join(','),
    );
  }
  return lines.join('\r\n');
}

/**
 * Lowercase slug for filenames (D-14). Allowlist `[a-z0-9]+` joined by
 * `-`; path characters can never survive, so `../x` traversal input
 * collapses to a harmless slug (T-06-02).
 */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

/** `hazra-worker-{slug}-{yyyymmdd}.csv|pdf` (D-14). `ymd` is a local YYYY-MM-DD key. */
export function workerFilename(workerName: string, ymd: string, ext: 'csv' | 'pdf'): string {
  return `hazra-worker-${slugify(workerName)}-${ymd.replace(/-/g, '')}.${ext}`;
}

/** `hazra-register-{siteslug}-{yyyymm}.csv|pdf` (D-14). `month` is a local YYYY-MM key. */
export function registerFilename(siteName: string, month: string, ext: 'csv' | 'pdf'): string {
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
      const chip = STATUS[entry.status];
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
 * Worksite-month register PDF table (EX-02): same contract as the worker
 * table plus a subtitle line and a Worker column. Sorted by date ASC then
 * worker name like the CSV.
 */
export function buildRegisterPdfHtml(args: {
  title: string;
  subtitle: string;
  rows: RegisterCsvRow[];
  theme: PdfTheme;
}): string {
  const sorted = [...args.rows].sort(
    (a, b) => compareDateAsc(a, b) || a.workerName.localeCompare(b.workerName),
  );
  const bodyRows = sorted
    .map((row) => {
      const chip = STATUS[row.status];
      const note = row.note === null || row.note === '' ? '—' : escapeHtml(row.note);
      return (
        `<tr>` +
        `<td style="${pdfCellStyle(args.theme)}">${escapeHtml(formatDisplay(row.date))}</td>` +
        `<td style="${pdfCellStyle(args.theme)}">${escapeHtml(row.workerName)}</td>` +
        `<td style="${pdfCellStyle(args.theme)}"><span style="display:inline-block;width:8px;height:8px;border-radius:4px;background-color:${chip.solid};"></span> ${escapeHtml(chip.label)}</td>` +
        `<td style="${pdfCellStyle(args.theme)}">${note}</td>` +
        `</tr>`
      );
    })
    .join('');
  return pdfShell({
    title: args.title,
    subtitle: args.subtitle,
    headerCells: ['Date', 'Worker', 'Status', 'Note'],
    bodyRows,
    summary: footerSummary(sorted),
    theme: args.theme,
  });
}
