# Midas SEO, AEO, and release metadata

## November 24, 2026 audit (search and answer engines)

The site was a single page. It ranked only for its own name and gave answer engines (ChatGPT search,
Claude, Perplexity, Google AI Overviews) little they could quote. There was one URL and six short FAQ
answers that depended on page context. The JSON-LD graph had no Organization or source-code entity,
there was no `llms.txt`, no explicit AI-crawler policy, and no PNG or Apple touch icon. People search
per provider (“Claude usage limit tracker”, “Codex rate limits”, “Cursor usage”, “Gemini quota”), and
none of those queries had a landing page. The Codex demo still showed **0 usable now**, which the app
stopped showing in 0.49.5.

Changes:

- **Six indexable content pages.**
  - `/claude`, `/codex`, `/cursor` and `/gemini`.
  - `/providers`: all 53 providers in the source at `v0.52.0-midas.1`.
  - `/ai-spend`: how estimates are calculated and the rules they follow.

  Each page has a unique title and description, a self-referencing canonical, Open Graph and Twitter
  tags, and a breadcrumb. Each also has an illustrative card, fact cards, sources, setup steps, a
  self-contained FAQ, related-page links, and the versioned download. A designed `/404` is
  `noindex, follow`.
- **Self-contained answers.** The homepage FAQ is now ten questions written to be quoted on their own,
  such as “What is Midas?”, “Is Midas free?” and “How is Midas related to CodexBar?”. Each answer names
  Midas and its subject rather than saying “it”.
- **Entity graph.** The homepage `#site-schema` `@graph` links Organization (`#prism`), WebSite,
  WebPage, ImageObject, SoftwareApplication and SoftwareSourceCode (`#source`). The SoftwareApplication
  entity (`#app`) includes the requirements, help link, release notes, feature list, and `isBasedOn`
  CodexBar. Each content page adds a WebPage, a BreadcrumbList, and a compact `#app` reference.
- **FAQPage JSON-LD is generated from the visible FAQ** at build time (see below), so the markup and the
  visible text can't drift apart.
- **`/llms.txt`.** A plain-text product summary with key facts, page links, and download and source links.
- **`robots.txt`.** Allows everything, and names the search and AI crawlers explicitly:
  - search: Googlebot, Bingbot, Applebot;
  - OpenAI: OAI-SearchBot, ChatGPT-User, GPTBot;
  - Anthropic: Claude-SearchBot, Claude-User, ClaudeBot;
  - others: PerplexityBot, Perplexity-User, DuckAssistBot, Google-Extended, Applebot-Extended.
- **Sitemap.** Seven URLs. Each `lastmod` equals that page's WebPage `dateModified`.
- **Internal links.** The site now links to the tracker pages from:
  - a row of links under the homepage marquee;
  - a footer tracker column on every page;
  - the homepage “50+ providers” kicker;
  - the header navigation on content pages;
  - related-page pills.
- **Icons.** `favicon-48.png` and `apple-touch-icon.png` are rendered from `public/favicon.svg` by
  `docs/render-icons.mjs`.
- **Hosting.** `vercel.json` adds:
  - `cleanUrls` and `trailingSlash: false`;
  - immutable caching for `/assets/*`;
  - a UTF-8 `text/plain` type for `llms.txt` and `robots.txt`;
  - `X-Robots-Tag: noindex` on `/404`.
- **Accuracy.** Every claim on the new pages, the homepage FAQ, and `llms.txt` was checked against the
  app source at tag `v0.51.0-midas.1`, and the errors found were fixed before publishing:
  - Cursor spend comes from Cursor's own reported costs, not API list prices.
  - Only Anthropic Admin spend is labeled billed.
  - Gemini settings live under Settings → Providers → Gemini.
  - The Codex one-account filter is a `defaults` preference.
- **Lighthouse 13.6** (mobile emulation, local production build). These are lab numbers, not field Core
  Web Vitals.
  - Homepage: SEO and accessibility 100.
  - `/claude`: performance, accessibility, and SEO 100.
  - `/providers`: performance between 89 and 97 across runs.

  Small dim text on content pages uses `#8a867e` to pass contrast, and below-the-fold content sections
  use `content-visibility: auto`.

## How the pages are built

`vite.config.ts` treats every root-level `*.html` as an entry. A `pre` HTML transform replaces each
`<!-- @include name -->` with `partials/name.html` (`header`, `footer`, `head-icons`, `hero-actions`,
`download`, `related`).

The same transform builds an FAQPage block (`id="faq-schema"`, with `@id` set to the canonical plus
`#faq`) from `.faq-items details` and injects it into `<head>`. The summary text becomes `name` and the
paragraph text becomes `acceptedAnswer`. Pages without a canonical or an FAQ get no block.

A dev/preview middleware serves `/claude` from `claude.html`, mirroring Vercel's `cleanUrls`. Content
pages load `src/page.ts` (icons, analytics, engagement, `aria-current`) and `src/pages.css`. The homepage
still uses `src/main.ts`.

To add a page:

1. Copy a tracker page.
2. Give it a unique title (62 characters or fewer) and description (110–160 characters).
3. Point its canonical, Open Graph and Twitter URLs, WebPage and breadcrumb at the new URL.
4. Add it to `public/sitemap.xml`, `public/llms.txt`, the `indexable` list in `tests/pages.spec.ts`,
   the footer partial, and the related partial.

## Current metadata contract

- Homepage:
  - Title: **Midas — AI Usage Tracker for Mac | Claude, Codex & Cursor**.
  - Description: **Track Claude, Codex, Cursor, and Gemini usage limits, resets, and estimated AI spend
    in your Mac menu bar. Free, open source, with optional private sync.**
  - H1: **Your AI usage. One glance.**
- Every indexable page:
  - has one H1;
  - has a title of 20–62 characters that contains “Midas”, and a description of 110–160 characters;
  - uses one `https://midas-ai.dev/<path>` URL for its canonical, `og:url`, and WebPage `url`;
  - repeats the head title and description in its Open Graph and Twitter tags and in its WebPage name
    and description.
- `robots` is `index, follow, max-image-preview:large` on indexable pages. `/404` is `noindex, follow`
  and has no canonical.
- Titles and descriptions are unique across pages.
- No invented ratings, reviews, user counts, or billed savings. Structured data describes the app; it
  doesn't claim rich-result eligibility. Google limits FAQ rich results to authoritative sites, so the
  FAQPage markup is there for entity clarity and answer engines, not as a promise of a rich snippet.
- Usage values are illustrative and labeled that way. API-rate estimates are not bills or savings.

## Validation

`pnpm build` checks TypeScript and the Vite output. `pnpm test` runs 43 browser checks.

For every indexable page, `tests/pages.spec.ts` checks:

- HTTP status and title and description lengths;
- one H1, and that the canonical and social tags agree;
- that the WebPage data matches the head and its date matches the sitemap;
- breadcrumbs, and that the FAQPage data matches the visible FAQ;
- download links and rendered icons;
- footer tracker links, the illustrative label, and no page errors.

Site-wide, it checks:

- titles and descriptions are unique;
- every internal link returns 200;
- the 53-provider list and the counts quoted on the page;
- the AI-spend sums and wording;
- `llms.txt` content and content type;
- robots rules;
- missing routes return a real 404;
- no overflow at 390 and 320 pixels.

`tests/site.spec.ts` still covers the homepage.

After deployment, run `BASE_URL=https://midas-ai.dev pnpm test`. Then read back:

- the raw production HTML and headers;
- `/llms.txt`;
- the legacy-host redirect;
- a missing-route 404;
- the current app archive checksum and both Sparkle feeds.

## Release checklist

1. Publish and independently verify the signed, notarized app and both update feeds first.
2. Update the versioned download URL in one change, everywhere it appears:
   - `index.html` (the links and the structured `downloadUrl`);
   - `partials/hero-actions.html` and `partials/download.html`;
   - `public/llms.txt`;
   - both test files.

   In the same change, update:
   - the release tag and the signed-update illustration;
   - `softwareVersion`;
   - the newest update card;
   - the README checksum;
   - the “UPDATED … · MIDAS x.y.z” line on the content pages.
3. Keep six update cards and exactly one LATEST badge. Use the actual local release date.
4. When a release changes how a provider behaves, update that provider's page, `/providers`, and
   `llms.txt`. Check them against the app repository at the release tag, not `main`.
5. Change a page's sitemap `lastmod` and its WebPage `dateModified` together, and only when its content
   changes. A browser test fails if they differ.
6. Test locally and push this repository's `main`. Then confirm that the linked `midas-by-prism`
   production deployment is Ready and serves that commit on `midas-ai.dev`.
7. Re-run the production checks and record the evidence. After adding pages, resubmit the sitemap in
   Search Console. Search engines choose their own titles and snippets and have to recrawl, so a
   deployment is not proof of indexing or ranking gains.

## October 27, 2026 audit (history)

The homepage was crawlable and already had a correct canonical URL, robots file, sitemap,
Search Console verification tag, and 1200×630 social image. Missing routes returned HTTP 404.
The main gaps were a benefit-only title that did not identify an AI usage tracker, a long
meta description with outdated “banked resets” wording, missing structured entity data,
and visible copy that did not immediately name the Mac app and its main supported services.
The privacy FAQ also needed to distinguish direct provider requests from optional usage sync.

## References

- [llms.txt proposal](https://llmstxt.org/)
- [OpenAI crawlers](https://platform.openai.com/docs/bots)

- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Google: software-app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)


## Verified production release (November 24, 2026, SEO/AEO pages)

Source `80828f7e071983ed25ccb07ab9efcfe18b8f04b0` deployed through the Git integration to production as
`dpl_6AFnJEPTQGrquPyfwDdsN3bKWpSV` (Ready, aliased to `midas-ai.dev`). All 43 local and all 43
production browser checks (`BASE_URL=https://midas-ai.dev pnpm test`) passed.

Raw production readback:

- `/`, `/claude`, `/codex`, `/cursor`, `/gemini`, `/providers`, `/ai-spend`, `/privacy`, `/llms.txt`,
  `/robots.txt` and `/sitemap.xml` return 200.
- `/claude/`, `/claude.html` and the legacy `midas-by-prism.vercel.app/claude` return 308 to
  `https://midas-ai.dev/claude`.
- A missing route returns 404.
- `/404` sends `X-Robots-Tag: noindex`, and `llms.txt` is served as `text/plain; charset=utf-8`.

`www.midas-ai.dev` still answers with a 307 (temporary) redirect to the apex. It is not one of this
project's domains (the project has only `midas-ai.dev` and `midas-by-prism.vercel.app`), so the
redirect is configured outside this repository. Making it a 308 is a domain-settings change.

## Verified production release (October 2026, 0.49.4)

Feature/SEO source `c75bcb94283ab1e7d32c4182b8020803a1d94ed3` deployed through the existing Git
integration to production as `dpl_HvqtUXhm4VpbiWcogECv8FF4jtbv` (Ready). All 21 local and all 21
production browser checks passed. Raw production HTML confirmed the new title, description,
canonical, and release links. The legacy host returns HTTP 308 to the canonical domain; missing
routes return HTTP 404. Anonymous app assets and both actual latest Sparkle feeds matched their
prepared SHA-256 checksums. The scoped Vercel error/fatal log query found no matching records;
this static site has no application function logs to substitute for browser checks.

Documentation-only commits can produce later Ready deployments with identical site output.
