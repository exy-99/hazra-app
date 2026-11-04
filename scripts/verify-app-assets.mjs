// Standing gate for plan 08-07: app.json icon/splash wiring.
// Run: node scripts/verify-app-assets.mjs
import { existsSync, readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const splash = (config.plugins || []).find(
  (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
);

let fail = false;
const ok = (pass, label) => {
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + label);
  if (!pass) fail = true;
};
const eq = (actual, expected, label) => {
  ok(actual === expected, label + ' = ' + JSON.stringify(actual));
};

// Every wired image path must exist on disk.
const wired = [
  ['expo.icon', config.icon],
  ['ios.icon', config.ios?.icon],
  ['android.adaptiveIcon.foregroundImage', config.android?.adaptiveIcon?.foregroundImage],
  ['web.favicon', config.web?.favicon],
  ['expo-splash-screen.image', splash?.[1]?.image],
];
for (const [label, path] of wired) {
  ok(typeof path === 'string' && existsSync(path), label + ' resolves (' + path + ')');
}

// D-34: splash background is the light background token literal.
eq(splash?.[1]?.backgroundColor, '#F0FDFA', 'splash backgroundColor');
eq(splash?.[1]?.imageWidth, 180, 'splash imageWidth');

// Android adaptive icon: colour background + foreground only (no stock pair).
eq(config.android?.adaptiveIcon?.backgroundColor, '#F0FDFA', 'adaptiveIcon backgroundColor');
ok(
  config.android?.adaptiveIcon?.backgroundImage === undefined,
  'adaptiveIcon has no backgroundImage'
);
ok(
  config.android?.adaptiveIcon?.monochromeImage === undefined,
  'adaptiveIcon has no monochromeImage'
);

// D-35: the favicon KEY stays untouched (deferred web scope).
eq(config.web?.favicon, './assets/images/favicon.png', 'web.favicon key unchanged');

// Keys that must never move while wiring assets.
eq(config.android?.package, 'com.exy99.hazraapp', 'android package');
eq(config.experiments?.typedRoutes, true, 'typedRoutes');
eq(config.experiments?.reactCompiler, true, 'reactCompiler');
for (const plugin of ['expo-router', 'expo-sqlite', 'expo-sharing']) {
  ok(
    (config.plugins || []).some((entry) => entry === plugin || (Array.isArray(entry) && entry[0] === plugin)),
    'plugin present: ' + plugin
  );
}

// Stock Expo art must be gone once the hazra set is wired.
for (const path of [
  'assets/images/expo-logo.png',
  'assets/images/logo-glow.png',
  'assets/images/android-icon-foreground.png',
  'assets/expo.icon',
]) {
  ok(!existsSync(path), 'stock asset removed: ' + path);
}

process.exit(fail ? 1 : 0);
