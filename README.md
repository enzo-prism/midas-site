# Midas website

Marketing site for [Midas](https://github.com/enzo-prism/midas), a free and open-source macOS menu-bar app that shows estimated AI inference spend at API rates, remaining quota, reset times, and banked resets for Codex, Cursor, Meta, and the other CodexBar providers.

Public site: https://midas-ai.dev (the `midas-by-prism.vercel.app` host permanently redirects there via `vercel.json`)

## Develop

Node 22 and pnpm. Run `pnpm install`, then `pnpm dev`.

- `pnpm build`: TypeScript checks and Vite production build.
- `pnpm test`: seventeen browser regression checks. Start `pnpm dev --port 4173` first.
- `BASE_URL=https://midas-ai.dev pnpm test`: public-site smoke checks.

Tests use installed Google Chrome through Playwright's chrome channel. Install Chrome if unavailable.

## Architecture and design

Static, semantic HTML with small TypeScript islands. Geist and Geist Mono fonts are self-hosted. Lucide supplies UI icons. Vercel Analytics is injected in `src/main.ts`; no auth, API keys, or backend required.

`index.html` owns content and metadata; `src/style.css` owns adaptive tokens and layouts; `src/main.ts` owns theme preference, the illustrative demo (favorite provider and spend period), scroll-reveal, and active-section nav highlighting. The demo never connects to real accounts.

Page order: hero, provider logo marquee, interactive overview demo (`#overview`), feature list (`#details`), menu-bar display modes (`#menubar`), three-step setup (`#setup`), estimate rules (`#trust`), open source, FAQ (`#faq`), release timeline (`#updates`), download (`#download`), footer. The header is sticky and highlights the section in view.

Motion: scroll reveal, the logo marquee, quota-bar fills, and the pulsing release dot are wrapped in `prefers-reduced-motion: no-preference` or disabled by the global reduced-motion rule. Under Reduce Motion the marquee becomes a static wrapped logo grid and every `[data-reveal]` element is visible without transitions.

Brand assets are minimal: `public/favicon.svg` and `public/og.png` share one gold crown mark. The 1200x630 social image is rendered from an HTML composition (site fonts, dark theme tokens, hero headline and subline, illustrative Orbit and spend-card mockups); the composition is `docs/og.html` (render with `pnpm exec vite --port 4174` then `node docs/render-og.mjs`). It deliberately shows no version number, so it only needs regenerating when the hero copy or supported-provider line changes; then bump the `?v=` query on the `og:image` and `twitter:image` URLs so scrapers refetch it. Provider logos render monochrome (dark ink in light mode, inverted in dark mode); only Meta keeps its brand color via `preserve-color`. Logo files come from the Midas app repository; see THIRD_PARTY_NOTICES.md and never redraw a mark.

The header, preview, and footer crowns (`span.pixel-crown` in `index.html`) are layered SVG: a four-stop gold gradient with a gem highlight, plus CSS-only motion (entrance rise, gentle float, breathing glow, periodic sheen sweep, single star twinkle, hover lift). See `docs/crown.md` for tokens and timings. Motion is transform/filter/opacity only and collapses to a static gold mark under Reduce Motion.

`src/ascii-crown.ts` draws an original rotating crown using a local point cloud and ASCII glyphs. Inspired by Prism's canvas animation technique, it caps playback at 18fps (12fps mobile), pauses offscreen/hidden, and becomes static with Reduce Motion. ResizeObserver and a 2x pixel-ratio cap keep it responsive. Theme preference is the only site-owned browser storage.

## Product content

Audience: heavy AI users who want to get the most out of their subscriptions and understand their usage. Copy is plain and concrete. Every feature claim must exist in the current Midas release; check the app repository's `CHANGELOG.md`, `README.md`, and `docs/MIDAS_SETUP.md` before adding one. No invented metrics, customer quotes, or faces.

Current download: Midas 0.44.0 (build 119), tag `v0.44.0-midas.1`, Apple Silicon, macOS 14+. The public archive passed checksum, Developer ID signature, notarization ticket, Gatekeeper, and Sparkle signature verification before this site was published. This does not establish installation or iCloud delivery on another Mac. App ZIP links are explicit immutable release assets, not dSYM archives. To update the app version, update the release badge, two download URLs, the download button label, the "ships in" line in `#details`, this document, and download assertions in tests together. Prepend a matching entry (version, date, chip, highlights, release-tag link) to the top of the `#updates` timeline and move the LATEST pill to it.

Optional usage sync combines recorded Codex, Claude Code, and Muse Code events through the same private shared folder selected in Settings → Sync on each Mac. Macs using the same Apple Account can use a dedicated iCloud Drive folder; no Midas account or credential backend is required. Each verified Cursor account/day is counted once, and shared history uses UTC days. Combined scope appears in monthly charts, spend history, menu-bar totals, and widgets; it does not add Codex cloud totals to local events. Sign-ins, credentials, conversation text, and quota limits stay local. The readable folder contains numeric usage, costs, public model names, opaque identities, and device labels, so only use a private folder. iCloud delivery can be delayed; a local save does not prove another Mac received it. Meta AI / the Muse consumer app has no verified numeric source and is currently unavailable. See the app’s `docs/MIDAS_USAGE_SYNC.md` for the source and privacy contract.

Spend history includes per-provider monthly cost and token charts across 6 or 12 calendar months, with hover details and accessible records. Current-month comparisons use the same elapsed days in the previous month only when matching records are available. Missing history stays unavailable, and explicit zero stays zero. Supported sources can load up to 365 days; Codex cloud currently supplies 30 days and Mistral only its current month. Chart costs preserve the source’s estimate or billed label. The interactive site demo remains illustrative and does not include a monthly chart.

Claude supports separate personal and work sign-ins with verified emails and optional nicknames. Each saved account refreshes independently and shows its own 5-hour and all-model weekly limits, reset times, and errors. Model-specific weekly limits remain in account details. Claude Code spend is a provider-wide estimate from local activity; it is not attributed to individual saved accounts. The sign-in flow leaves the current Claude Code login unchanged.

Estimated spend is priced at public API rates and is never a bill. Orbit shows one provider-wide weekly allowance, or Cursor’s monthly allowance; model-specific and session quotas do not drive its ring. Meta has no quota. Banked resets are separate from weekly resets. Preserve those distinctions. All demo values are illustrative and provider spends sum to each period's total.

## Deploy

GitHub: https://github.com/enzo-prism/midas-site

Vercel project: `midas-by-prism`, team `enzo-design-prisms-projects`. Production deploys from `main` through the Vercel Git integration. To deploy manually, link explicitly with `vercel link --project midas-by-prism --scope enzo-design-prisms-projects`, then `vercel --prod`. Never commit `.vercel` or `.env` files. If changing the public domain, update canonical, Open Graph, robots, and sitemap URLs together.

## Credits

Midas is a fork of CodexBar by Peter Steinberger and contributors. Provider marks belong to their respective owners and do not imply endorsement. See THIRD_PARTY_NOTICES.md.

## Google Search Console

Canonical, Open Graph, robots, and sitemap URLs use `https://midas-ai.dev/`. The original URL-prefix property is `https://midas-by-prism.vercel.app/` (verified by the Google meta tag in `index.html`; preserve it through redesigns); `midas-ai.dev` needs its own Search Console property with sitemap `https://midas-ai.dev/sitemap.xml`.
