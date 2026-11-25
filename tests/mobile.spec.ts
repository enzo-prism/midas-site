import { test, expect, type Page } from '@playwright/test';

// Phones can't run Midas, so these checks emulate an iPhone: touch, a 390px screen, and its user agent.
const iPhone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: iPhone });

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const captured: string[] = [];
  errors.set(page, captured);
  page.on('pageerror', error => captured.push(error.message));
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

test('download buttons send the link to your Mac through the share sheet', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { shared: ShareData[] }).shared = [];
    Object.defineProperty(navigator, 'share', { value: async (data: ShareData) => { (window as unknown as { shared: ShareData[] }).shared.push(data); } });
    Object.defineProperty(navigator, 'canShare', { value: () => true });
  });
  await page.goto('/');
  const hero = page.locator('.hero-actions .download-link');
  await expect(hero).toContainText('Send to my Mac');
  await expect(hero).toHaveAttribute('href', 'https://midas-ai.dev/#download');
  // The archive stays one tap away.
  const direct = page.locator('.handoff-direct').first();
  await expect(direct).toHaveAttribute('href', /\.zip$/);
  await hero.click();
  const shared = await page.evaluate(() => (window as unknown as { shared: ShareData[] }).shared);
  expect(shared).toEqual([expect.objectContaining({ url: 'https://midas-ai.dev/#download' })]);
  await expect(page).toHaveURL(/\/$/);
});

test('without a share sheet the link is copied and a toast says so', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await page.goto('/claude');
  await page.locator('.sub-hero .download-link').click();
  await expect(page.locator('#site-toast')).toHaveText(/Link copied/);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://midas-ai.dev/#download');
});

test('the menu opens, links every page, and closes on Escape', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Open menu' });
  const nav = page.locator('#site-nav');
  await expect(nav).toBeHidden();
  await button.click();
  await expect(nav).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  for (const name of ['Features', 'FAQ', 'Claude tracker', 'All providers', 'AI spend']) await expect(nav.getByRole('link', { name })).toBeVisible();
  for (const link of await nav.getByRole('link').all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press('Escape');
  await expect(nav).toBeHidden();
  await expect(button).toBeFocused();
});

test('the analytics choice leaves most of the first screen visible', async ({ page }) => {
  await page.goto('/');
  const box = await page.locator('.analytics-choice').boundingBox();
  expect(box!.height).toBeLessThan(844 * 0.16);
  await expect(page.locator('.analytics-short')).toBeVisible();
  await expect(page.locator('.analytics-long')).toBeHidden();
});

test('phone layout: short page, no sideways scroll, full-size tap targets, readable text', async ({ page }) => {
  for (const path of ['/', '/claude', '/providers']) {
    await page.goto(path);
    await page.evaluate(() => document.querySelector('.analytics-choice')?.remove());
    await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
    const result = await page.evaluate(() => {
      const small: string[] = [];
      for (const el of document.querySelectorAll('a,button,summary')) {
        const r = el.getBoundingClientRect();
        // Links inside a sentence are exempt, as are the hero demo's own controls (enlarged by ::after).
        if (!r.width || el.closest('.stage,p,.crumbs,.sr-only,li.prose,.ptable p,.step-list,.provider-footnote')) continue;
        if (r.height < 40) small.push(`${el.textContent!.trim().slice(0, 30)} ${Math.round(r.height)}px`);
      }
      const tiny: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const el = node.parentElement!;
        if (!node.textContent!.trim() || el.closest('.stage,svg,[aria-hidden="true"],.sr-only')) continue;
        if (parseFloat(getComputedStyle(el).fontSize) < 10) tiny.push(node.textContent!.trim().slice(0, 30));
      }
      return { screens: document.documentElement.scrollHeight / innerHeight, wide: document.documentElement.scrollWidth > innerWidth, small, tiny };
    });
    expect(result.wide, path).toBe(false);
    expect(result.small, path).toEqual([]);
    expect(result.tiny, path).toEqual([]);
    if (path === '/') expect(result.screens).toBeLessThan(11);
  }
});

test('the four smaller feature cards scroll sideways in one row', async ({ page }) => {
  await page.goto('/');
  const rail = page.locator('.bento-rail');
  await expect(rail).toHaveCSS('scroll-snap-type', 'x mandatory');
  const cards = rail.locator('> .card');
  await expect(cards).toHaveCount(4);
  const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
  expect(second!.y).toBe(first!.y);
});

test.describe('on a Mac', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36' });
  test('download buttons keep the archive link and the menu button stays hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-actions .download-link')).toHaveAttribute('href', /\.zip$/);
    await expect(page.locator('.handoff-direct')).toHaveCount(0);
    await expect(page.locator('.menu-button')).toBeHidden();
    await expect(page.locator('#site-nav')).toBeVisible();
    await expect(page.locator('.nav-pages')).toBeHidden();
  });
});
