# Midas SEO and release metadata

## October 27, 2026 audit

The homepage was crawlable and already had a correct canonical URL, robots file, sitemap,
Search Console verification tag, and 1200×630 social image. Missing routes returned HTTP 404.
The main gaps were a benefit-only title that did not identify an AI usage tracker, a long
meta description with outdated “banked resets” wording, missing structured entity data,
and visible copy that did not immediately name the Mac app and its main supported services.
The privacy FAQ also needed to distinguish direct provider requests from optional usage sync.

## Current metadata contract

- Title: **Midas — AI Usage Tracker for Mac | Claude, Codex & Cursor** (57 characters).
- Description: **Track Claude, Codex, and Cursor usage, quotas, resets, and estimated AI spend in your Mac menu bar. Free, open source, with optional private sync.** (146 characters).
- H1: **Your AI usage. One glance.** One H1; supporting copy names the Mac menu bar and services.
- Open Graph and Twitter titles/descriptions match the search metadata. Both reference the
  existing illustrative 1200×630 image and include descriptive image alternative text.
- Canonical and Open Graph URL: `https://midas-ai.dev/`.
- Robots permits indexing and large image previews; the XML sitemap lists one canonical page.
- JSON-LD describes WebSite, WebPage, and SoftwareApplication entities. The app entity identifies
  Apple Silicon, macOS 14+, a free USD 0 offer, MIT licensing, the actual current version and
  immutable download URL, and the Prism publisher already credited on the page.
- No invented ratings or reviews. This is descriptive entity markup, not a claim of Google
  software-app rich-result eligibility. FAQ content remains native HTML, with no promise of FAQ rich results.
- Usage values remain illustrative. API-rate estimates are not bills or savings claims.
- Google Search Console verification remains intact. Ownership and indexing for the canonical
  `midas-ai.dev` property were not inspected or changed in this release; preserve any existing
  property and submit its canonical sitemap through the owner's verified account when needed.

## Validation

`pnpm build` checks TypeScript and the Vite production output. `pnpm test` runs 21 browser checks,
including metadata consistency, structured data matching the visible free download, canonical
URLs, robots/sitemap, image dimensions, keyboard interactions, reduced motion, privacy, and no
horizontal overflow at 1440, 390, and 320 pixels. Run the same suite with
`BASE_URL=https://midas-ai.dev pnpm test` after deployment. Also read back the raw production
HTML and headers, legacy-host redirect, actual missing-page 404, current app archive checksum,
and both Sparkle latest-feed URLs. Browser tests are not field Core Web Vitals measurements.

## Release checklist

1. Publish and independently verify the signed/notarized app and both update feeds first.
2. Update both download links, release tag, signed-update illustration, softwareVersion,
   structured downloadUrl, newest update card, README checksum, and browser assertions together.
3. Keep six update cards and exactly one LATEST badge. Use the actual local release date.
4. Change sitemap lastmod and WebPage dateModified only when page content changes.
5. Test locally, push this repository's main, then confirm the linked `midas-by-prism`
   production deployment is Ready and serves that exact commit on `midas-ai.dev`.
6. Re-run production checks and record evidence. Search engines choose their own title links
   and snippets and must recrawl changes; deployment is not proof of indexing or ranking gains.

## References

- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Google: software-app structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
