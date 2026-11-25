// Renders the PNG favicon fallbacks from public/favicon.svg: run `node docs/render-icons.mjs`.
// 48x48 is the smallest size Google Search uses for site icons; 180x180 is the Apple touch icon.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
const svg = readFileSync('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
for (const [size, path, inset] of [[48, 'public/favicon-48.png', 0], [180, 'public/apple-touch-icon.png', 0]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // The touch icon is square: iOS rounds its corners, so the background fills the whole tile.
  const body = size === 180
    ? `<body style="margin:0;background:#141610">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `).replace('rx="7"', 'rx="0"')}</body>`
    : `<body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`;
  await page.setContent(body);
  await page.screenshot({ path, omitBackground: size !== 180, clip: { x: inset, y: inset, width: size, height: size } });
  await page.close();
}
await browser.close();
