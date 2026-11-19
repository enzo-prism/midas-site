import { test, expect, type Page } from '@playwright/test';

// Run canonical-host behavior against our local source, without sending test traffic to Google.
test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL?.includes('midas-ai.dev')) await page.route('https://midas-ai.dev/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${baseURL}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.route(/https:\/\/[^/]*google-analytics\.com\//, route => route.abort());
  // Keep Vercel's queue local so test runs never count as visits or downloads, even against production.
  await page.route('**/_vercel/insights/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
});

type Recorded = [string, Record<string, string>];
const gaEvents = (page: Page) => page.evaluate(() => ((window as any).dataLayer ?? [])
  .map((args: IArguments) => Array.from(args))
  .filter((args: unknown[]) => args[0] === 'event')
  .map((args: unknown[]) => [args[1], args[2]])) as Promise<Recorded[]>;
const gaConfig = (page: Page) => page.evaluate(() => ((window as any).dataLayer ?? [])
  .map((args: IArguments) => Array.from(args))
  .find((args: unknown[]) => args[0] === 'config')?.[2]);

test.afterEach(async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await page.unrouteAll({ behavior: 'wait' });
});

test('GA4 needs opt-in, loads once, remembers consent, and withdraws cleanly', async ({ page, context }) => {
  await page.goto('https://midas-ai.dev/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#analytics-choice')).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'No thanks', exact: true }).click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#analytics-choice')).toBeHidden();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect(page.locator('script[src*="G-0WWYML8MTL"]')).toHaveCount(1);
  const commands = await page.evaluate(() => (window as any).dataLayer.map((args: any) => Array.from(args)));
  expect(commands.filter((args: any) => args[0] === 'config')).toHaveLength(1);
  expect(commands[0]).toEqual(['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }]);
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await expect(page.locator('script[src*="G-0WWYML8MTL"]')).toHaveCount(1);
  await context.addCookies([{ name: '_ga', value: 'test', domain: '.midas-ai.dev', path: '/' }]);
  await page.getByRole('button', { name: 'Analytics preferences', exact: true }).click();
  await page.getByRole('button', { name: 'No thanks', exact: true }).click();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  expect((await context.cookies()).some(cookie => cookie.name === '_ga')).toBe(false);
});

test('expired choice is asked again and previews never load GA4', async ({ page, baseURL }) => {
  await page.addInitScript(() => localStorage.setItem('midas-analytics-consent-v1', JSON.stringify({ allowed: true, time: 0 })));
  await page.goto('https://midas-ai.dev/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#analytics-choice')).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  if (!baseURL?.includes('midas-ai.dev')) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  }
});

test('opted-in visits record CTA placement, sections, FAQ opens and demo use; Vercel counts every download click', async ({ page }) => {
  await page.goto('https://midas-ai.dev/');
  await page.waitForLoadState('networkidle');
  // Keep download clicks on the page; only what gets recorded matters here.
  await page.evaluate(() => document.addEventListener('click', event => {
    if ((event.target as Element).closest('a[data-cta="download"]')) event.preventDefault();
  }));
  const heroDownload = page.locator('a[data-cta="download"][data-cta-location="hero"]');
  await heroDownload.click();
  expect(await gaEvents(page)).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify((window as any).vaq ?? []))).toContain('{"name":"Download","data":{"location":"hero"}}');

  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  // The hero was already on screen before consent; it is still reported once.
  await expect.poll(() => gaEvents(page)).toContainEqual(['section_view', { section: 'hero' }]);
  await heroDownload.click();
  await page.locator('#orbit-item').click();
  await page.locator('button[data-mode="ledger"]').click();
  // A smooth nav jump to the FAQ counts the FAQ once it settles, not the sections it scrolled past.
  await page.locator('.header nav a[href="#faq"]').click();
  await expect.poll(() => gaEvents(page)).toContainEqual(['section_view', { section: 'faq' }]);
  await page.locator('.faq-items summary').first().click();
  await expect.poll(() => gaEvents(page)).toContainEqual(['faq_open', { question: 'Is AI Spend my bill?' }]);
  const recorded = await gaEvents(page);
  expect(recorded).not.toContainEqual(['section_view', { section: 'sync' }]);
  expect(recorded).not.toContainEqual(['section_view', { section: 'trust' }]);
  expect(recorded).toContainEqual(['cta_click', { cta: 'download', cta_location: 'hero' }]);
  expect(recorded).toContainEqual(['demo_interact', expect.objectContaining({ control: 'menu_bar' })]);
  expect(recorded).toContainEqual(['demo_interact', { control: 'menu_bar_mode', choice: 'ledger' }]);
  // Each section is reported once, and downloads stay GA4's own file_download key event.
  const sections = recorded.filter(([name]) => name === 'section_view').map(([, params]) => params.section);
  expect(new Set(sections).size).toBe(sections.length);
  expect(recorded.some(([name]) => name === 'file_download')).toBe(false);
});

test('?internal=1 tags GA4 traffic as internal, drops Vercel events and cleans the URL; ?internal=0 clears it', async ({ page }) => {
  await page.goto('https://midas-ai.dev/?internal=1&utm_source=test#faq');
  await page.waitForLoadState('networkidle');
  expect(page.url()).toBe('https://midas-ai.dev/?utm_source=test#faq');
  expect(await page.evaluate(() => localStorage.getItem('midas-internal-v1'))).toBe('1');
  await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  expect((await gaConfig(page))?.traffic_type).toBe('internal');
  const vercelKeeps = () => page.evaluate(() => {
    const filter = ((window as any).vaq ?? []).find((args: unknown[]) => args[0] === 'beforeSend')?.[1];
    return filter({ type: 'event', url: location.href }) !== null;
  });
  expect(await vercelKeeps()).toBe(false);

  await page.goto('https://midas-ai.dev/?internal=0');
  await page.waitForLoadState('networkidle');
  expect(page.url()).toBe('https://midas-ai.dev/');
  expect(await page.evaluate(() => localStorage.getItem('midas-internal-v1'))).toBeNull();
  // Consent is remembered, so the tag loads again, now without the internal marker.
  await expect.poll(() => gaConfig(page)).toBeTruthy();
  expect((await gaConfig(page))?.traffic_type).toBeUndefined();
  expect(await vercelKeeps()).toBe(true);
});
