import { test, expect, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const captured: string[] = [];
  errors.set(page, captured);
  page.on('pageerror', error => captured.push(error.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

const money = (text: string | null) => Number(text!.replace(/[^0-9.]/g, ''));

test('the site is dark only, even when the system prefers light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
  await expect(page.locator('#theme-toggle')).toHaveCount(0);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 7, 10)');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
});

test('hero panel provider spends always sum to the illustrative total in both periods', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const panel = page.locator('#panel');
  await expect(panel).toHaveClass(/is-open/);
  for (const [period, total, orbit] of [['This month', '$391.35', '$391'], ['Last 30 days', '$633.45', '$633']]) {
    if (period !== 'This month') await page.getByRole('button', { name: 'Change the demo spend period' }).click();
    await expect(page.locator('#period-name')).toHaveText(period);
    await expect(page.locator('#panel-total')).toHaveText(total);
    await expect(page.locator('#orbit-spend')).toHaveText(orbit);
    const parts = await page.locator('[data-spend]').allTextContents();
    expect(parts).toHaveLength(4);
    expect(parts.reduce((sum, part) => sum + money(part), 0)).toBeCloseTo(money(total), 2);
  }
  await expect(page.locator('.demo-disclaimer')).toContainText(/illustrative/i);
  // Meta reports no limit, so the demo never invents a percentage for it.
  await expect(page.locator('[data-row="meta"] .pbar')).toHaveCount(0);
  await expect(page.locator('[data-row="meta"]')).toContainText('no reported limit');
});

test('hero plays like a screen recording, and a visitor can take over', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  const stage = page.locator('#stage');
  await expect(stage).toHaveClass(/is-playing/);
  await expect(page.locator('#panel')).toHaveClass(/is-open/, { timeout: 6000 });
  await expect(page.locator('#period-name')).toHaveText('Last 30 days', { timeout: 10000 });
  await page.getByRole('button', { name: 'Toggle the illustrative Midas panel' }).click();
  await expect(stage).not.toHaveClass(/is-playing/);
  const open = await page.locator('#panel').evaluate(element => element.classList.contains('is-open'));
  await page.getByRole('button', { name: 'Toggle the illustrative Midas panel' }).click();
  if (open) await expect(page.locator('#panel')).not.toHaveClass(/is-open/);
  else await expect(page.locator('#panel')).toHaveClass(/is-open/);
  await expect(page.locator('#orbit-item')).toHaveAttribute('aria-expanded', String(!open));
});

test('reduced motion shows the finished hero frame without a cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('#stage')).not.toHaveClass(/is-playing/);
  await expect(page.locator('#stage')).toHaveClass(/is-filled/);
  await expect(page.locator('#cursor')).toBeHidden();
  await expect(page.locator('#panel-total')).toHaveText('$391.35');
});

test('provider marquee renders every bundled logo and a static fallback under reduced motion', async ({ page }) => {
  const logos = page.locator('.provider-set:not([aria-hidden]) img');
  expect(await logos.count()).toBe(21);
  for (const logo of await logos.all()) {
    expect(await logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await expect(page.locator('.provider-set[aria-hidden="true"]')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.provider-set[aria-hidden="true"]')).toBeHidden();
  await expect(page.locator('.provider-track')).toHaveCSS('animation-name', 'none');
});

test('navigation covers every section and reveals content on scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const links = page.locator('.header nav a[href^="#"]');
  expect(await links.count()).toBe(5);
  for (const href of await links.evaluateAll(anchors => anchors.map(a => a.getAttribute('href')!))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  await expect(page.locator('#features [data-reveal]').first()).toHaveCSS('opacity', '0');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Updates' }).click();
  await expect.poll(async () => page.locator('#features [data-reveal]:not(.in-view)').count()).toBe(0);
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect.poll(async () => page.locator('[data-reveal]:not(.in-view)').count()).toBe(0);
  await expect(page.locator('.header nav a[aria-current="true"]')).toHaveCount(1);
});

test('feature bento keeps its live components honest', async ({ page }) => {
  const features = page.locator('#features');
  await features.scrollIntoViewIfNeeded();
  await expect(features).toContainText('ESTIMATE ≠ YOUR BILL');
  await expect(features).toContainText('5-hour and weekly limits');
  await expect(features).toContainText('Cursor Models');
  await expect(features).toContainText('Grok Bot');
  await expect(features).toContainText('never averaged');
  await expect(features).toContainText('Billed stays separate');
  await expect(features).toContainText('Liquid Glass on macOS 26');
  await expect(page.locator('i[data-lucide]')).toHaveCount(0);
  // The share bar's providers add up to the headline total.
  const legend = await page.locator('.share-legend li').allTextContents();
  expect(legend.reduce((sum, item) => sum + money(item), 0)).toBeCloseTo(391.35, 2);
  // Months without records render as unavailable, never as a zero-height bar.
  await page.locator('#chart').scrollIntoViewIfNeeded();
  await expect(page.locator('#chart .col')).toHaveCount(12);
  await expect(page.locator('#chart .col.missing')).toHaveCount(2);
  const before = await page.locator('#chart .col.now i').first().evaluate(element => element.style.height);
  await page.getByRole('button', { name: 'Tokens', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tokens', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.locator('#chart .col.now i').first().evaluate(element => element.style.height)).not.toBe(before);
});

test('DGX Spark names its rate basis and loads the NVIDIA mark unfiltered', async ({ page }) => {
  const spark = page.locator('#dgx-spark');
  await spark.scrollIntoViewIfNeeded();
  await expect(spark).toContainText('DGX Spark. Local tokens, cloud value.');
  await expect(spark).toContainText('LAST 30 DAYS');
  await expect(spark).toContainText('API-EQUIVALENT, NOT A BILL');
  const logo = spark.locator('.nvidia-logo');
  expect(await logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(logo).toHaveCSS('filter', 'none');
  const answer = page.locator('#faq details').filter({ hasText: 'How is DGX Spark valued?' });
  await answer.locator('summary').click();
  await expect(answer.locator('a')).toHaveAttribute('href', 'https://lyceum.technology/models/qwen/qwen3.8-flash-next/');
  await expect(answer).toContainText('not a bill or a savings claim');
});

test('menu-bar modes switch by click and keyboard, with privacy masking', async ({ page }) => {
  await page.locator('#menubar').scrollIntoViewIfNeeded();
  const view = page.locator('#mode-view');
  for (const [mode, caption] of [['Ledger', 'Just the number'], ['Focus', 'remaining quota'], ['Constellation', 'A dash when'], ['Orbit', 'weekly allowance']]) {
    await page.getByRole('tab', { name: new RegExp(`^${mode}`) }).click();
    await expect(view).toHaveAttribute('data-mode', mode.toLowerCase());
    await expect(page.locator('#mode-caption')).toContainText(caption);
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  }
  await page.keyboard.press('ArrowRight');
  await expect(view).toHaveAttribute('data-mode', 'ledger');
  await page.getByRole('button', { name: 'Spend privacy' }).click();
  await expect(view).toHaveClass(/is-private/);
  await expect(page.locator('.bm-ledger .bm-money')).not.toHaveCSS('filter', 'none');
});

test('FAQ supports keyboard expansion and closing', async ({ page }) => {
  const summary = page.locator('summary').first();
  const details = page.locator('details').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.locator('p')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  const privacy = page.locator('#faq details').filter({ hasText: 'What leaves my Mac?' });
  await privacy.locator('summary').click();
  await expect(privacy).toContainText('Prompts, conversation text, and credentials stay local');
});

for (const width of [1440, 390, 320]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

const pixels = (page: Page) => page.locator('#ascii-crown').evaluate((element: HTMLCanvasElement) => {
  const bytes = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
  return { hash, populated: bytes.some(value => value !== 0) };
});

test('decorative canvas animates normally and remains static with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#ascii-crown').scrollIntoViewIfNeeded();
  const normal = await pixels(page);
  expect(normal.populated).toBe(true);
  await expect.poll(async () => (await pixels(page)).hash).not.toBe(normal.hash);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(250);
  const reduced = await pixels(page);
  expect(reduced.populated).toBe(true);
  await page.waitForTimeout(800);
  expect(await pixels(page)).toEqual(reduced);
  await expect(page.locator('#ascii-crown')).toHaveAttribute('aria-hidden', 'true');
});

test('updates list releases newest-first with source links', async ({ page }) => {
  await page.getByRole('navigation').getByRole('link', { name: 'Updates' }).click();
  const entries = page.locator('.update-list > li');
  await expect(entries).toHaveCount(6);
  await expect(entries.first()).toContainText('0.48.4');
  await expect(entries.nth(1)).toContainText('0.48.3');
  await expect(entries.first().getByRole('heading', { name: 'Every Mac’s full history, shared', exact: true })).toBeVisible();
  await expect(entries.first()).toContainText('OCT 20, 2026');
  await expect(entries.first().locator('.latest-pill')).toHaveText('LATEST');
  await expect(page.locator('.latest-pill')).toHaveCount(1);
  await expect(entries.first().locator('.update-source')).toHaveAttribute('href', 'https://github.com/enzo-prism/midas/releases/tag/v0.48.4-midas.1');
  for (const entry of await entries.all()) {
    await expect(entry.locator('.update-source')).toHaveAttribute('href', /enzo-prism\/midas\/releases\/tag\//);
  }
});

test('social preview image is 1200x630 and referenced by Open Graph and Twitter tags', async ({ page }) => {
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(ogImage).toMatch(/\/og\.png(\?v=\d+)?$/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', ogImage!);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /illustrative/i);
  const size = await page.evaluate(() => new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('og.png failed to load'));
    image.src = '/og.png';
  }));
  expect(size).toEqual({ width: 1200, height: 630 });
});

test('download CTAs use versioned Midas arm64 app ZIP URLs', async ({ page }) => {
  const links = page.locator('a.download-link');
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', 'https://github.com/enzo-prism/midas/releases/download/v0.48.4-midas.1/Midas-0.48.4-macos-arm64.zip');
  }
  await expect(page.locator('.release-tag')).toContainText('MIDAS 0.48.4');
  await expect(page.locator('#download .download-link')).toContainText('Download Midas 0.48.4');
  await expect(page.locator('body')).toContainText('APPLE SILICON');
});

test('canonical domain, Search Console tag, and sync claims', async ({ page }) => {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://midas-ai.dev/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://midas-ai.dev/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/midas-ai\.dev\//);
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(1);
  const sync = page.locator('#sync');
  await expect(sync).toContainText('Private Tailscale hub or iCloud Drive folder');
  await expect(sync).toContainText('No Midas account needed');
  await expect(sync).toContainText('Prompts stay local');
  await expect(sync).toContainText('DGX Spark');
  await expect(page.locator('body')).not.toContainText('keeps the CodexBar filename');
});
