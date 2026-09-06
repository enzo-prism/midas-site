# Midas website

Marketing site for [Midas](https://github.com/enzo-prism/midas), a free and open-source macOS menu-bar app for token spend at API rates and remaining usage.

Public site: https://midas-by-prism.vercel.app

## Develop

Node 22 and pnpm. Run `pnpm install`, then `pnpm dev`.

- `pnpm build`: TypeScript checks and Vite production build.
- `pnpm test`: nine browser regression checks. Start `pnpm dev --port 4173` first.
- `BASE_URL=https://midas-by-prism.vercel.app pnpm test`: public-site smoke checks.

Tests use installed Google Chrome through Playwright's chrome channel. Install Chrome if unavailable.

## Architecture and design

Static, semantic HTML with small TypeScript islands. Geist and Geist Mono fonts are self-hosted. Lucide supplies UI icons. Vercel Analytics is injected in `src/main.ts`; no auth, API keys, or backend required.

`index.html` owns content and metadata; `src/style.css` owns adaptive tokens and layouts; `src/main.ts` owns theme preference and the illustrative provider demo. The demo never connects to real accounts.

Brand assets are minimal: `public/favicon.svg` and `public/og.png` share one gold crown mark. Provider logos render monochrome (dark ink in light mode, inverted in dark mode); only Meta keeps its brand color via `preserve-color`.

`src/ascii-crown.ts` draws an original rotating crown using a local point cloud and ASCII glyphs. Inspired by Prism's canvas animation technique, it caps playback at 18fps (12fps mobile), pauses offscreen/hidden, and becomes static with Reduce Motion. ResizeObserver and a 2x pixel-ratio cap keep it responsive. Theme preference is the only site-owned browser storage.

## Product content

Current download: Midas 0.33.5, Apple Silicon, macOS 14+. App ZIP links are explicit immutable release assets, not dSYM archives. To update the app version, update the release badge, two download URLs, download version caption, this document, and download assertions in tests together. Confirm the linked release is signed and published. Prepend a matching entry (version, date, highlights, release-tag link) to the top of the `#updates` timeline and move the LATEST pill to it.

“Token spend (API rates)” is an estimate, not a bill. Codex quota is weekly; Cursor uses reported quota; Meta has no quota. Preserve those distinctions. All demo values are illustrative.

## Deploy

GitHub: https://github.com/enzo-prism/midas-site

Vercel project: `midas-by-prism`, team `enzo-design-prisms-projects`. Link explicitly with `vercel link --project midas-by-prism --scope enzo-design-prisms-projects`, then `vercel --prod`. Never commit `.vercel` or `.env` files. If changing the public domain, update canonical, Open Graph, robots, and sitemap URLs together.

## Credits

Midas is a fork of CodexBar by Peter Steinberger and contributors. Provider marks belong to their respective owners and do not imply endorsement. See THIRD_PARTY_NOTICES.md.

## Google Search Console

URL-prefix property: `https://midas-by-prism.vercel.app/`. Ownership uses the Google verification meta tag in `index.html`; preserve it through redesigns. Sitemap: `https://midas-by-prism.vercel.app/sitemap.xml`. A new custom domain needs its own property and updated canonical/sitemap URLs.
