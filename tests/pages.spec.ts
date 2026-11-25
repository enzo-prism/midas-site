import { test, expect, type Page } from '@playwright/test';

// Search and answer-engine contract for every indexable page. Runs against the dev server or,
// with BASE_URL=https://midas-ai.dev, against production.
const origin = 'https://midas-ai.dev';
const indexable = ['/', '/claude', '/codex', '/cursor', '/gemini', '/providers', '/ai-spend'];
const download = 'https://github.com/enzo-prism/midas/releases/download/v0.51.0-midas.1/Midas-0.51.0-macos-arm64.zip';
const canonicalOf = (path: string) => `${origin}${path}`;

type Entity = Record<string, any>;
async function schemas(page: Page): Promise<Entity[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap(block => {
    const data = JSON.parse(block);
    return data['@graph'] ?? [data];
  });
}
const visibleText = (text: string) => text.replace(/\s+/g, ' ').trim();

async function sitemapDates(request: import('@playwright/test').APIRequestContext) {
  const xml = await (await request.get('/sitemap.xml')).text();
  return Object.fromEntries([...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(([, loc, date]) => [loc, date]));
}

test('the sitemap lists exactly the indexable pages', async ({ request }) => {
  const dates = await sitemapDates(request);
  expect(Object.keys(dates).sort()).toEqual(indexable.map(canonicalOf).sort());
});

for (const path of indexable) {
  test(`${path} is a complete, self-consistent search result`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const canonical = canonicalOf(path);

    // One title, one description, one H1, a self-referencing canonical, and matching social tags.
    const title = await page.title();
    expect(title.length).toBeGreaterThan(20);
    expect(title.length).toBeLessThanOrEqual(62);
    expect(title).toContain('Midas');
    const description = (await page.locator('meta[name="description"]').getAttribute('content'))!;
    expect(description.length).toBeGreaterThanOrEqual(110);
    expect(description.length).toBeLessThanOrEqual(160);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow, max-image-preview:large');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) await expect(page.locator(selector)).toHaveAttribute('content', title);
    for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) await expect(page.locator(selector)).toHaveAttribute('content', description);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

    // Structured data: the page entity matches the head, and its date matches the sitemap.
    const entities = await schemas(page);
    const webpage = entities.find(entity => entity['@type'] === 'WebPage')!;
    expect(webpage.url).toBe(canonical);
    expect(webpage.name).toBe(title);
    expect(webpage.description).toBe(description);
    expect((await sitemapDates(request))[canonical]).toBe(webpage.dateModified);
    const app = entities.find(entity => entity['@type'] === 'SoftwareApplication')!;
    expect(app['@id']).toBe(`${origin}/#app`);
    expect(app.offers).toMatchObject({ price: '0', priceCurrency: 'USD' });
    expect(app.aggregateRating).toBeUndefined();
    expect(app.review).toBeUndefined();
    if (path !== '/') {
      const crumbs = entities.find(entity => entity['@type'] === 'BreadcrumbList')!;
      expect(crumbs.itemListElement.at(-1).item).toBe(canonical);
      expect(crumbs.itemListElement[0].item).toBe(`${origin}/`);
      await expect(page.locator('nav.crumbs a[href="/"]')).toHaveCount(1);
    }

    // FAQPage markup is generated from, and therefore matches, the visible questions and answers.
    const faq = entities.find(entity => entity['@type'] === 'FAQPage')!;
    expect(faq.url).toBe(canonical);
    const items = page.locator('.faq-items details');
    expect(faq.mainEntity).toHaveLength(await items.count());
    for (const [index, question] of faq.mainEntity.entries()) {
      const item = items.nth(index);
      expect(question.name).toBe(visibleText(await item.locator('summary').textContent() ?? ''));
      expect(question.acceptedAnswer.text).toBe(visibleText(await item.locator('p').textContent() ?? ''));
    }

    // Every download points at the current verified archive; icons rendered; footer links the trackers.
    const links = page.locator('a.download-link');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const link of await links.all()) await expect(link).toHaveAttribute('href', download);
    await expect(page.locator('i[data-lucide]')).toHaveCount(0);
    for (const tracker of ['/claude', '/codex', '/cursor', '/gemini', '/providers', '/ai-spend']) {
      await expect(page.locator(`footer a[href="${tracker}"]`)).toHaveCount(1);
    }
    await expect(page.locator('body')).toContainText(/illustrative/i);
    expect(errors).toEqual([]);
  });
}

test('titles and descriptions are unique across pages', async ({ page }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of indexable) {
    await page.goto(path);
    titles.add(await page.title());
    descriptions.add((await page.locator('meta[name="description"]').getAttribute('content'))!);
  }
  expect(titles.size).toBe(indexable.length);
  expect(descriptions.size).toBe(indexable.length);
});

test('every internal link on every page resolves', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of indexable) {
    await page.goto(path);
    const hrefs = await page.locator('a[href^="/"]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')!));
    hrefs.forEach(href => seen.add(href.split('#')[0] || '/'));
  }
  expect(seen.size).toBeGreaterThanOrEqual(8);
  for (const href of seen) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
});

test('provider pages are reachable from the homepage and from each other', async ({ page }) => {
  await page.goto('/');
  for (const path of ['/claude', '/codex', '/cursor', '/gemini', '/ai-spend']) {
    await expect(page.locator(`.tracker-links a[href="${path}"]`)).toHaveCount(1);
  }
  await expect(page.locator('.section-kicker a[href="/providers"]')).toHaveCount(1);
  await page.goto('/claude');
  for (const path of ['/codex', '/cursor', '/gemini', '/providers', '/ai-spend']) {
    await expect(page.locator(`.related a[href="${path}"]`)).toHaveCount(1);
  }
  await expect(page.locator('.header nav a[aria-current="page"]')).toHaveText('Claude');
});

test('the providers page lists all 52 providers once, and its counts agree', async ({ page }) => {
  await page.goto('/providers');
  const names = (await page.locator('.ptable h3').allTextContents()).map(name => name.trim());
  expect(names).toHaveLength(52);
  expect(new Set(names).size).toBe(52);
  for (const name of ['Codex', 'Claude', 'Cursor', 'Gemini', 'Meta', 'OpenRouter', 'GitHub Copilot', 'DGX Spark']) expect(names).toContain(name);
  await expect(page.locator('.lede')).toContainText('tracks 52 AI services');
  const faq = page.locator('.faq-items details').filter({ hasText: 'How many AI providers' });
  await expect(faq).toContainText('supports 52 providers');
  await expect(page.locator('.ptable a[href="/claude"]').first()).toBeVisible();
});

test('AI spend copy never presents an estimate as a bill or savings', async ({ page }) => {
  await page.goto('/ai-spend');
  await expect(page.locator('main')).toContainText('never a bill');
  await expect(page.locator('main')).toContainText('Missing is never $0');
  await expect(page.locator('main')).toContainText('Billed stays separate');
  await expect(page.locator('main')).not.toContainText(/you saved \$|save up to/i);
  // The illustrative estimate rows sum to the total, and the billed row is kept out of it.
  const rows = await page.locator('.pcard .prow b').allTextContents();
  const amounts = rows.map(text => Number(text.replace(/[^0-9.]/g, '')));
  expect(amounts.slice(0, 4).reduce((sum, value) => sum + value, 0)).toBeCloseTo(391.35, 2);
  await expect(page.locator('.pcard .panel-amount')).toHaveText('$391.35');
});

test('llms.txt summarizes the product and links every page', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('text/plain');
  const text = await response.text();
  expect(text.startsWith('# Midas\n')).toBe(true);
  expect(text).toMatch(/^> Midas is a free, open-source macOS menu-bar app/m);
  expect(text).toContain('Midas 0.51.0');
  expect(text).toContain(download);
  for (const path of indexable) expect(text).toContain(`](${canonicalOf(path)})`);
  expect(text).toContain('never a bill');
});

test('robots allows search and answer engines and points to the sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).not.toMatch(/^Disallow:\s*\/\s*$/m);
  for (const agent of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'Googlebot', 'Bingbot']) expect(robots).toContain(`User-agent: ${agent}`);
  expect(robots).toContain('Sitemap: https://midas-ai.dev/sitemap.xml');
});

test('the 404 page is not indexable and missing routes return 404', async ({ page, request }) => {
  const missing = await request.get('/this-page-does-not-exist');
  expect(missing.status()).toBe(404);
  await page.goto('/404');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('.related a[href="/claude"]')).toHaveCount(1);
});

for (const width of [390, 320]) {
  test(`content pages have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of indexable.slice(1)) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
}
