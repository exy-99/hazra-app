// Standing gate: WCAG 2.x contrast ratio for every text-bearing color pair,
// computed in light AND dark modes independently (D-10 / D-43).
//
// Run: node scripts/verify-contrast.mjs
// Exits non-zero if ANY pair < 4.5:1 in either mode, or if global.css outline
// literals drift from Colors.ring values (08-03 lockstep rule).
//
// No TS imports — reads source files as text and extracts hex literals.

import { readFileSync } from 'node:fs';

const THEME_SRC = readFileSync('src/constants/theme.ts', 'utf8');
const STATUS_SRC = readFileSync('src/constants/status.ts', 'utf8');
const CSS_SRC = readFileSync('src/global.css', 'utf8');

// Strip comments so regexes don't match inside them.
function stripComments(src) {
  return src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
}

// Extract a hex color literal from a specific Colors.mode block.
// Looks for `  key: '#hex',` inside `light: { ... }` or `dark: { ... }`.
function extractColor(code, mode, key) {
  const blockRe = new RegExp(`${mode}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`);
  const m = code.match(blockRe);
  if (!m) return null;
  const block = m[1];
  const kv = new RegExp(`^\\s*${key}:\\s*('([#][0-9a-fA-F]{3,8})')\\s*,?\\s*$`, 'm');
  const kvm = block.match(kv);
  return kvm ? kvm[2] : null;
}

// Extract STATUS entry colors from status.ts source.
function extractStatus(code) {
  const statuses = {};
  for (const name of ['present', 'absent', 'half_day', 'off_day']) {
    // Match: name: { label: '...', solid: '#hex', tint: '#hex', text: '#hex' }
    const entryRe = new RegExp(
      `${name}:\\s*\\{[\\s\\S]*?solid:\\s*'([#][0-9a-fA-F]{3,8})'[\\s\\S]*?tint:\\s*'([#][0-9a-fA-F]{3,8})'[\\s\\S]*?text:\\s*'([#][0-9a-fA-F]{3,8})'`,
    );
    const m = code.match(entryRe);
    if (m) {
      statuses[name] = { solid: m[1], tint: m[2], text: m[3] };
    }
  }
  return statuses;
}

// WCAG relative luminance per-channel linearization.
function linearize(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const c = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

const RATIO_MIN = 4.5;
let failures = 0;
let escalations = 0;
const rows = [];

function check(label, fg, bg, isCritical = true) {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= RATIO_MIN;
  if (!pass) {
    if (isCritical) failures++;
    else escalations++;
  }
  rows.push({ label, fg, bg, ratio: ratio.toFixed(2), pass, critical: isCritical });
}

// ---- Build color maps per mode ----
const modes = ['light', 'dark'];
const colors = {};
for (const mode of modes) {
  colors[mode] = {
    text: extractColor(THEME_SRC, mode, 'text'),
    foreground: extractColor(THEME_SRC, mode, 'foreground'),
    background: extractColor(THEME_SRC, mode, 'background'),
    surface: extractColor(THEME_SRC, mode, 'surface'),
    muted: extractColor(THEME_SRC, mode, 'muted'),
    mutedForeground: extractColor(THEME_SRC, mode, 'mutedForeground'),
    textSecondary: extractColor(THEME_SRC, mode, 'textSecondary'),
    primary: extractColor(THEME_SRC, mode, 'primary'),
    onPrimary: extractColor(THEME_SRC, mode, 'onPrimary'),
    accent: extractColor(THEME_SRC, mode, 'accent'),
    onAccent: extractColor(THEME_SRC, mode, 'onAccent'),
    destructive: extractColor(THEME_SRC, mode, 'destructive'),
    onDestructive: extractColor(THEME_SRC, mode, 'onDestructive'),
    ring: extractColor(THEME_SRC, mode, 'ring'),
  };
}

const STATUS = extractStatus(STATUS_SRC);

// ---- Product pairs (both modes) ----
for (const mode of modes) {
  const c = colors[mode];
  check(`${mode}: text/background`, c.text, c.background);
  check(`${mode}: foreground/background`, c.foreground, c.background);
  check(`${mode}: foreground/surface`, c.foreground, c.surface);
  check(`${mode}: text/surface`, c.text, c.surface);
  check(`${mode}: mutedForeground/surface`, c.mutedForeground, c.surface);
  check(`${mode}: mutedForeground/background`, c.mutedForeground, c.background);
  check(`${mode}: mutedForeground/muted`, c.mutedForeground, c.muted);
  check(`${mode}: textSecondary/background`, c.textSecondary, c.background);
  check(`${mode}: primary/onPrimary`, c.primary, c.onPrimary);
  check(`${mode}: accent/onAccent`, c.accent, c.onAccent);
  check(`${mode}: destructive/onDestructive`, c.destructive, c.onDestructive);
  check(`${mode}: destructive/surface`, c.destructive, c.surface);
  check(`${mode}: destructive/background`, c.destructive, c.background);
}

// ---- Transient-state pairs (D-41) ----
for (const mode of modes) {
  const c = colors[mode];
  check(`${mode}: skeleton muted/surface`, c.muted, c.surface, false);
  check(`${mode}: success card text/surface`, c.text, c.surface);
  check(`${mode}: success card primary/surface`, c.primary, c.surface);
  check(`${mode}: share notice mutedForeground/muted`, c.mutedForeground, c.muted);
  check(`${mode}: validation frame destructive/surface`, c.destructive, c.surface);
}

// ---- STATUS pairs (frozen contract — check only, escalate never bump) ----
for (const [name, s] of Object.entries(STATUS)) {
  for (const mode of modes) {
    const c = colors[mode];
    check(`${mode}: STATUS.${name} text/tint`, s.text, s.tint, false);
    check(`${mode}: STATUS.${name} text/surface`, s.text, c.surface, false);
    check(`${mode}: STATUS.${name} solid/tint`, s.solid, s.tint, false);
  }
}

// ---- Print table ----
console.log('\nWCAG contrast ratio (≥4.5:1 required, both modes):\n');
console.log('| Pair | FG | BG | Light | Dark | Pass |');
console.log('|------|----|----|-------|------|------|');

// Group rows by label base (strip mode prefix) for side-by-side light/dark.
const byLabel = {};
for (const row of rows) {
  const [mode, ...labelParts] = row.label.split(': ');
  const label = labelParts.join(': ');
  if (!byLabel[label]) byLabel[label] = {};
  byLabel[label][mode] = row;
}

for (const [label, modesMap] of Object.entries(byLabel)) {
  const light = modesMap.light;
  const dark = modesMap.dark;
  const fg = light?.fg || dark?.fg || '';
  const bg = light?.bg || dark?.bg || '';
  const lr = light ? light.ratio : '—';
  const dr = dark ? dark.ratio : '—';
  console.log(
    `| ${label} | ${fg} | ${bg} | ${lr} | ${dr} | ${light.pass && dark.pass ? 'PASS' : 'FAIL'} |`,
  );
}

// ---- global.css outline lockstep (08-03 rule) ----
console.log('\n--- global.css focus-ring lockstep ---');
const cssCode = stripComments(CSS_SRC);
const lightOutline = cssCode.match(/outline:\s*2px\s+solid\s+('#[0-9a-fA-F]{3,8}'|#[0-9a-fA-F]{3,8})/);
const darkOutline = cssCode.match(
  /prefers-color-scheme:\s*dark[\s\S]*?outline-color:\s*('#[0-9a-fA-F]{3,8}'|#[0-9a-fA-F]{3,8})/,
);
const expectedLight = colors.light.ring;
const expectedDark = colors.dark.ring;

const lightOk = lightOutline && lightOutline[1].replace(/'/g, '') === expectedLight;
const darkOk = darkOutline && darkOutline[1].replace(/'/g, '') === expectedDark;
console.log(
  `  light outline: ${lightOk ? 'ok' : 'FAIL'} (${lightOutline?.[1] ?? 'missing'} vs ${expectedLight})`,
);
console.log(
  `  dark outline:  ${darkOk ? 'ok' : 'FAIL'} (${darkOutline?.[1] ?? 'missing'} vs ${expectedDark})`,
);
if (!lightOk || !darkOk) failures++;

// ---- Verdict ----
console.log(`\n${failures === 0 && lightOk && darkOk ? 'CONTRAST_OK' : 'CONTRAST_FAIL (critical)'}`);
if (escalations > 0) {
  console.log(`\nESCALATIONS (frozen STATUS contract / subtle placeholder — user decision required):`);
  for (const row of rows) {
    if (!row.pass && !row.critical) {
      console.log(`  ${row.label}: ${row.ratio}:1 (${row.fg} on ${row.bg})`);
    }
  }
}
if (failures > 0) {
  console.error(`\nContrast check FAILED (${failures} critical pair${failures === 1 ? '' : 's'} below 4.5:1)`);
  process.exit(1);
}
console.log('\nAll critical contrast pairs ≥ 4.5:1 in both modes.');
process.exit(0);
