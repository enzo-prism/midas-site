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

test('theme choice persists after reload in both directions', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('favorite changes preserve totals and distinguish unknown Meta capacity', async ({ page }) => {
  const total = await page.locator('.preview-total').textContent();
  const orbitTotal = await page.locator('#orbit-spend').textContent();
  for (const [provider, quota, spend] of [
    ['Cursor', '64% left', '$42.80'], ['Meta', 'Not reported', '$19.40'], ['Codex', '72% left', '$186.40'],
  ]) {
    await page.getByRole('button', { name: provider, exact: true }).click();
    await expect(page.locator('#preview-name')).toHaveText(provider);
    await expect(page.locator('#quota-value')).toHaveText(quota);
    await expect(page.locator('#provider-spend')).toHaveText(spend);
    await expect(page.locator('.preview-total')).toHaveText(total!);
    await expect(page.locator('#orbit-spend')).toHaveText(orbitTotal!);
    await expect(page.locator('[data-provider][aria-pressed="true"]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: provider, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#orbit-logo')).toHaveAttribute('alt', `${provider} favorite provider`);
    await expect(page.locator('#orbit-ring')).toHaveCSS('border-top-style', provider === 'Meta' ? 'dashed' : 'solid');
  }
  await expect(page.locator('.demo-disclaimer')).toContainText(/illustrative/i);
});

test('period chip cycles illustrative totals and keeps provider spend consistent', async ({ page }) => {
  await expect(page.locator('#period-name')).toHaveText('This month');
  await expect(page.locator('.preview-total')).toHaveText('$248.60');
  await page.getByRole('button', { name: 'Change the demo spend period' }).click();
  await expect(page.locator('#period-name')).toHaveText('Last 30 days');
  await expect(page.locator('#period-range')).toHaveText('Aug 14 – Sep 13');
  await expect(page.locator('.preview-total')).toHaveText('$412.15');
  await expect(page.locator('#orbit-spend')).toHaveText('$412');
  await expect(page.locator('#provider-spend')).toHaveText('$309.75');
  await page.getByRole('button', { name: 'Cursor', exact: true }).click();
  await expect(page.locator('#provider-spend')).toHaveText('$71.20');
  await expect(page.locator('.preview-total')).toHaveText('$412.15');
  await page.getByRole('button', { name: 'Change the demo spend period' }).click();
  await page.getByRole('button', { name: 'Change the demo spend period' }).click();
  await expect(page.locator('#period-name')).toHaveText('This month');
  await expect(page.locator('#provider-spend')).toHaveText('$42.80');
});

test('per-account Codex details only appear for the Codex favorite', async ({ page }) => {
  const accounts = page.locator('#preview-accounts');
  await expect(accounts).toBeVisible();
  await expect(accounts).toContainText('Banked resets');
  await expect(accounts).toContainText('Unavailable');
  await page.getByRole('button', { name: 'Meta', exact: true }).click();
  await expect(accounts).toBeHidden();
  await page.getByRole('button', { name: 'Codex', exact: true }).click();
  await expect(accounts).toBeVisible();
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
  expect(await links.count()).toBe(6);
  for (const href of await links.evaluateAll(anchors => anchors.map(a => a.getAttribute('href')!))) {
    await expect(page.locator(href)).toHaveCount(1);
  }
  await expect(page.locator('#details [data-reveal]').first()).toHaveCSS('opacity', '0');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Updates' }).click();
  await expect.poll(async () => page.locator('#details [data-reveal]:not(.is-visible)').count()).toBe(0);
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect.poll(async () => page.locator('[data-reveal]:not(.is-visible)').count()).toBe(0);
  await expect(page.locator('#updates-title')).toBeVisible();
  await expect(page.locator('.header nav a[aria-current="true"]')).toHaveCount(1);
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
});

for (const width of [1440, 390, 320]) {
  test(`no horizontal overflow at ${width}px in either theme`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
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

test('updates timeline tracks releases newest-first with source links', async ({ page }) => {
  await page.getByRole('navigation').getByRole('link', { name: 'Updates' }).click();
  await expect(page.locator('#updates-title')).toBeVisible();
  const entries = page.locator('.update-list > li');
  expect(await entries.count()).toBeGreaterThanOrEqual(4);
  await expect(entries.first()).toContainText('0.37.1');
  await expect(entries.nth(1)).toContainText('0.37.0');
  await expect(entries.first()).toContainText('Cursor is back');
  await expect(entries.first().locator('.latest-pill')).toHaveText('LATEST');
  await expect(entries.first().locator('.update-source')).toHaveAttribute('href', 'https://github.com/enzo-prism/midas/releases/tag/v0.37.1-midas.1');
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

test('download CTAs point to the actual Midas arm64 app ZIP', async ({ page }) => {
  const links = page.locator('a.download-link');
  expect(await links.count()).toBeGreaterThanOrEqual(2);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('href', 'https://github.com/enzo-prism/midas/releases/download/v0.37.1-midas.1/Midas-0.37.1-macos-arm64.zip');
  }
  await expect(page.locator('body')).toContainText('Apple Silicon');
});

test('canonical domain and current product claims', async ({ page }) => {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://midas-ai.dev/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://midas-ai.dev/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/midas-ai\.dev\//);
  const features = page.locator('#details .feature-list');
  await expect(features).toContainText('5-hour and weekly limits');
  await expect(features).toContainText('Billed API spend');
  await expect(page.locator('body')).not.toContainText('keeps the CodexBar filename');
});
