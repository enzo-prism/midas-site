# Midas website

Marketing site for [Midas](https://github.com/enzo-prism/midas), a free and open-source macOS menu-bar app that shows estimated AI inference spend at API rates, remaining quota, reset times, and banked resets for Codex, Cursor, Meta, and the other CodexBar providers.

Public site: https://midas-ai.dev (the `midas-by-prism.vercel.app` host permanently redirects there via `vercel.json`)

## Develop

Node 22 and pnpm. Run `pnpm install`, then `pnpm dev`.

- `pnpm build`: TypeScript checks and Vite production build.
- `pnpm test`: fourteen browser regression checks. Start `pnpm dev --port 4173` first.
- `BASE_URL=https://midas-ai.dev pnpm test`: public-site smoke checks.

Tests use installed Google Chrome through Playwright's chrome channel. Install Chrome if unavailable.

## Architecture and design

Static, semantic HTML with small TypeScript islands. Geist and Geist Mono fonts are self-hosted. Lucide supplies UI icons. Vercel Analytics is injected in `src/main.ts`; no auth, API keys, or backend required.

`index.html` owns content and metadata; `src/style.css` owns adaptive tokens and layouts; `src/main.ts` owns theme preference, the illustrative demo (favorite provider and spend period), scroll-reveal, and active-section nav highlighting. The demo never connects to real accounts.

Page order: hero, provider logo marquee, interactive overview demo (`#overview`), six-feature grid (`#details`), menu-bar display modes (`#menubar`), three-step setup (`#setup`), estimate rules (`#trust`), open source, FAQ (`#faq`), release timeline (`#updates`), download (`#download`), footer. The header is sticky and highlights the section in view.

Motion: scroll reveal, the logo marquee, quota-bar fills, and the pulsing release dot are wrapped in `prefers-reduced-motion: no-preference` or disabled by the global reduced-motion rule. Under Reduce Motion the marquee becomes a static wrapped logo grid and every `[data-reveal]` element is visible without transitions.

Brand assets are minimal: `public/favicon.svg` and `public/og.png` share one gold crown mark. The 1200x630 social image is rendered from an HTML composition (site fonts, dark theme tokens, hero headline and subline, illustrative Orbit and spend-card mockups); the composition is `docs/og.html` (render with `pnpm exec vite --port 4174` then `node docs/render-og.mjs`). It deliberately shows no version number, so it only needs regenerating when the hero copy or supported-provider line changes; then bump the `?v=` query on the `og:image` and `twitter:image` URLs so scrapers refetch it. Provider logos render monochrome (dark ink in light mode, inverted in dark mode); only Meta keeps its brand color via `preserve-color`. Logo files come from the Midas app repository; see THIRD_PARTY_NOTICES.md and never redraw a mark.

The header, preview, and footer crowns (`span.pixel-crown` in `index.html`) are layered SVG: a four-stop gold gradient with a gem highlight, plus CSS-only motion (entrance rise, gentle float, breathing glow, periodic sheen sweep, single star twinkle, hover lift). See `docs/crown.md` for tokens and timings. Motion is transform/filter/opacity only and collapses to a static gold mark under Reduce Motion.

`src/ascii-crown.ts` draws an original rotating crown using a local point cloud and ASCII glyphs. Inspired by Prism's canvas animation technique, it caps playback at 18fps (12fps mobile), pauses offscreen/hidden, and becomes static with Reduce Motion. ResizeObserver and a 2x pixel-ratio cap keep it responsive. Theme preference is the only site-owned browser storage.

## Product content

Audience: heavy AI users who want to get the most out of their subscriptions and understand their usage. Copy is plain and concrete. Every feature claim must exist in the current Midas release; check the app repository's `CHANGELOG.md`, `README.md`, and `docs/MIDAS_SETUP.md` before adding one. No invented metrics, customer quotes, or faces.

Current download: Midas 0.40.0, Apple Silicon, macOS 14+. App ZIP links are explicit immutable release assets, not dSYM archives. To update the app version, update the release badge, two download URLs, the download button label, the "ships in" line in `#details`, this document, and download assertions in tests together. Confirm the linked release is signed and published. Prepend a matching entry (version, date, chip, highlights, release-tag link) to the top of the `#updates` timeline and move the LATEST pill to it.

Estimated spend is priced at public API rates and is never a bill. Codex quota is weekly; Cursor uses its reported quota; Meta has no quota. Banked resets are separate from weekly resets. Preserve those distinctions. All demo values are illustrative and provider spends sum to each period's total.

## Deploy

GitHub: https://github.com/enzo-prism/midas-site

Vercel project: `midas-by-prism`, team `enzo-design-prisms-projects`. Production deploys from `main` through the Vercel Git integration. To deploy manually, link explicitly with `vercel link --project midas-by-prism --scope enzo-design-prisms-projects`, then `vercel --prod`. Never commit `.vercel` or `.env` files. If changing the public domain, update canonical, Open Graph, robots, and sitemap URLs together.

## Credits

Midas is a fork of CodexBar by Peter Steinberger and contributors. Provider marks belong to their respective owners and do not imply endorsement. See THIRD_PARTY_NOTICES.md.

## Google Search Console

Canonical, Open Graph, robots, and sitemap URLs use `https://midas-ai.dev/`. The original URL-prefix property is `https://midas-by-prism.vercel.app/` (verified by the Google meta tag in `index.html`; preserve it through redesigns); `midas-ai.dev` needs its own Search Console property with sitemap `https://midas-ai.dev/sitemap.xml`.
