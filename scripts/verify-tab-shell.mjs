// Self-check for plan 01-07: four-tab shell + three new tab screens.
// Run: node scripts/verify-tab-shell.mjs
import { existsSync, readFileSync } from 'node:fs';
const count = (f, p) => (readFileSync(f, 'utf8').match(new RegExp(p, 'g')) || []).length;
let fail = false;
const eq = (a, b, l) => {
  console.log((a === b ? 'PASS' : 'FAIL') + ' ' + l + ' = ' + a);
  if (a !== b) fail = true;
};
eq(count('src/components/app-tabs.tsx', 'name="attendance"'), 1, 'native attendance');
eq(count('src/components/app-tabs.tsx', 'name="workers"'), 1, 'native workers');
eq(count('src/components/app-tabs.tsx', 'name="reports"'), 1, 'native reports');
eq(count('src/components/app-tabs.tsx', 'name="index"'), 1, 'native index');
eq(count('src/components/app-tabs.tsx', 'name="explore"'), 0, 'native no explore');
eq(count('src/components/app-tabs.web.tsx', 'href="/attendance"'), 1, 'web attendance');
eq(count('src/components/app-tabs.web.tsx', 'href="/workers"'), 1, 'web workers');
eq(count('src/components/app-tabs.web.tsx', 'href="/reports"'), 1, 'web reports');
eq(count('src/components/app-tabs.web.tsx', 'Expo Starter'), 0, 'web no brand');
eq(count('src/components/app-tabs.web.tsx', 'docs.expo.dev'), 0, 'web no docs');
eq(count('src/app/(tabs)/index.tsx', 'Welcome to'), 0, 'home no starter');
for (const f of ['attendance', 'workers', 'reports']) {
  const ok = existsSync('src/app/(tabs)/' + f + '.tsx');
  console.log((ok ? 'PASS' : 'FAIL') + ' exists ' + f);
  if (!ok) fail = true;
}
console.log(!existsSync('src/app/explore.tsx') ? 'PASS explore deleted' : 'FAIL explore exists');
if (existsSync('src/app/explore.tsx')) fail = true;
for (const f of ['src/app/(tabs)/attendance.tsx', 'src/app/(tabs)/workers.tsx', 'src/app/(tabs)/reports.tsx']) {
  const n = count(f, 'useTheme');
  console.log((n >= 1 ? 'PASS' : 'FAIL') + ' useTheme in ' + f + ' = ' + n);
  if (n < 1) fail = true;
}
let fetchCount = 0;
for (const f of ['src/app/(tabs)/attendance.tsx', 'src/app/(tabs)/workers.tsx', 'src/app/(tabs)/reports.tsx', 'src/app/(tabs)/index.tsx']) {
  fetchCount += count(f, 'fetch\\(');
}
eq(fetchCount, 0, 'no fetch(');
let hex = 0;
for (const f of ['src/components/app-tabs.tsx', 'src/components/app-tabs.web.tsx', 'src/app/(tabs)/index.tsx', 'src/app/(tabs)/attendance.tsx', 'src/app/(tabs)/workers.tsx', 'src/app/(tabs)/reports.tsx']) {
  hex += count(f, '#[0-9a-fA-F]{3,8}');
}
eq(hex, 0, 'no hardcoded hex');
process.exit(fail ? 1 : 0);
