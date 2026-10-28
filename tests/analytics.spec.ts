import { test, expect } from '@playwright/test';

// Run canonical-host behavior against our local source, without sending test traffic to Google.
test.beforeEach(async ({ page, baseURL }) => {
  await page.route('https://midas-ai.dev/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${baseURL}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  await page.route('https://www.googletagmanager.com/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.route(/https:\/\/[^/]*google-analytics\.com\//, route => route.abort());
});

test('GA4 needs opt-in, loads once, remembers consent, and withdraws cleanly', async ({ page, context }) => {
  await page.goto('https://midas-ai.dev/');
  await expect(page.locator('#analytics-choice')).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'No thanks', exact: true }).click();
  await page.reload();
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
  await expect(page.locator('#analytics-choice')).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  if (!baseURL?.includes('midas-ai.dev')) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  }
});
