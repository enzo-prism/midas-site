# Midas website

Marketing site for [Midas](https://github.com/enzo-prism/midas), a free and open-source macOS menu-bar app that shows estimated AI inference spend at API rates, remaining quota, reset times, and reset-credit availability for Codex, Cursor, Meta, and the other CodexBar providers.

Public site: https://midas-ai.dev (the `midas-by-prism.vercel.app` host permanently redirects there via `vercel.json`)

## Develop

Node 22 and pnpm. Run `pnpm install`, then `pnpm dev`.

- `pnpm build`: TypeScript checks and Vite production build.
- `pnpm test`: browser regression checks. Start `pnpm dev --port 4173` first.
- `BASE_URL=https://midas-ai.dev pnpm test`: public-site smoke checks.

Tests use installed Google Chrome through Playwright's chrome channel. Install Chrome if unavailable.

## Architecture and design

Static, semantic HTML with small TypeScript islands. Geist and Geist Mono fonts are self-hosted. Lucide supplies UI icons. Vercel Analytics is injected in `src/main.ts`; no auth, API keys, or backend. Optional GA4 is managed by `src/analytics.ts`; analytics consent is stored in the visitor’s browser for 180 days. See [docs/analytics.md](docs/analytics.md).

The site is **dark only** (2026-10-20 redesign): `color-scheme: dark`, `theme-color` `#07070a`, no theme toggle, and no light tokens. It is visual-first: short headings and one-line captions, with the explanation carried by live components rather than paragraphs. Keep it that way; put long-form detail in the app repo's docs or the GitHub release notes and link out. `index.html` owns content and metadata; `src/style.css` owns the dark tokens (`--bg`, `--fg`, `--muted`, `--dim`, `--gold`…) and layouts; `src/main.ts` owns the hero player, count-ups, the live reset countdown, the monthly chart, the menu-bar mode switcher, scroll reveal, and active-section nav highlighting. Nothing connects to real accounts.

Page order: hero with the illustrative desktop stage (`#product`), provider logo marquee, feature bento (`#features`), menu-bar display modes (`#menubar`), optional sync diagram (`#sync`), estimate rules (`#trust`), six most recent releases (`#updates`), FAQ (`#faq`, six short answers), download with the ASCII crown (`#download`), footer. The header is sticky, gains a hairline once scrolled, and highlights the section in view.

Hero stage: a faux macOS desktop (menu bar with the Orbit item, a terminal of AI-agent activity, and a native-style 360pt panel modeled on `MidasPanelView`: AI Spend, period control, token total, Codex/Claude/Cursor/Meta rows, sync + Spend history footer). `src/main.ts` plays it like a screen recording: a cursor opens the menu, the total counts up, bars fill, callouts appear, the period switches to Last 30 days, a row is hovered, refresh spins, and the menu closes, then loops. Cursor positions come from layout offsets so the stage's 3D tilt never skews them. Playback pauses off-screen or in a hidden tab. Any real click (`isTrusted`) on the menu-bar item or the period stops the recording and hands control to the visitor; it resumes after 9s idle. Demo data: each period's four provider spends must sum to its total (This month $391.35, Last 30 days $633.45); Meta has no bar because it reports no limit.

Feature bento: one honest number (share bar sums to the total), Claude/Cursor meters with a ticking 5-hour reset, per-account rings (never averaged), the 12-month chart (Cost/Tokens toggle; months with no records render as hatched “unavailable” stubs, never zero), billed-vs-estimated ledgers kept apart, DGX Spark (wide, NVIDIA mark + 30-day bars, first days unpriced), privacy, native SwiftUI/Liquid Glass, and a signed-update sheet. Menu-bar modes auto-advance with a progress underline until a visitor picks a tab (arrow keys work); Spend privacy blurs the dollar readings. The sync diagram is SVG with `animateMotion` packets.

Motion: hero playback, aurora drift, terminal line reveals, count-ups, bar/chart growth, the logo marquee, mode auto-advance, sync packets, the release dot, and scroll reveal all respect Reduce Motion. Under Reduce Motion the hero shows the finished open-panel frame with no cursor, the marquee becomes a static wrapped logo grid, modes stop auto-advancing, sync packets are hidden, and every `[data-reveal]` element is visible without transitions. Live bits (countdown, bars) start only once their card is in view.

Brand assets are minimal: `public/favicon.svg` and `public/og.png` share one gold crown mark. The 1200x630 social image is rendered from an HTML composition (site fonts, dark theme tokens, hero headline and subline, illustrative Orbit and spend-card mockups); the composition is `docs/og.html` (render with `pnpm exec vite --port 4174` then `node docs/render-og.mjs`). It deliberately shows no version number, so it only needs regenerating when the hero copy or supported-provider line changes; then bump the `?v=` query on the `og:image` and `twitter:image` URLs so scrapers refetch it. Provider logos render monochrome white (`brightness(0) invert(1)`); Meta keeps its brand color via `preserve-color`, and the DGX Spark card and sync node use the original white-wordmark NVIDIA mark (`nvidia-dark.svg`) unfiltered. `nvidia-light.svg` is kept for the OG composition and future light contexts. Logo files come from the Midas app repository; see THIRD_PARTY_NOTICES.md and never redraw a mark.

The header, signed-update card, and footer crowns (`span.pixel-crown` in `index.html`) are layered SVG: a four-stop gold gradient with a gem highlight, plus CSS-only motion (entrance rise, gentle float, breathing glow, periodic sheen sweep, single star twinkle, hover lift). See `docs/crown.md` for tokens and timings. Motion is transform/filter/opacity only and collapses to a static gold mark under Reduce Motion. The hero panel uses the app's own `crown.fill` SF Symbol look (a Lucide crown), not the pixel crown.

`src/ascii-crown.ts` draws an original rotating crown behind the download section's headline using a local point cloud and ASCII glyphs. Inspired by Prism's canvas animation technique, it caps playback at 18fps (12fps mobile), pauses offscreen/hidden, and becomes static with Reduce Motion. ResizeObserver and a 2x pixel-ratio cap keep it responsive.

## Product content

Audience: heavy AI users who want to get the most out of their subscriptions and understand their usage. Copy is plain and concrete. Every feature claim must exist in the current Midas release; check the app repository's `CHANGELOG.md`, `README.md`, and `docs/MIDAS_SETUP.md` before adding one. No invented metrics, customer quotes, or faces.

Current verified public download: Midas 0.49.4 (build 136), tag `v0.49.4-midas.1`, Apple Silicon, macOS 14+, archive `Midas-0.49.4-macos-arm64.zip`. Before publishing versioned download links, verify the matching public archive checksum, Developer ID signature, notarization ticket, Gatekeeper, archive/feed signatures, and both latest feeds. App publication, local installation, and website production deployment require separate readbacks. This does not establish installation or receipt on another Mac. App ZIP links are explicit immutable release assets, not dSYM archives. To update the app version, update the hero release tag (`.release-tag`), the two download URLs, the download button label, the signed-update card version, this document, and the download/updates assertions in tests together. Prepend a card (version, one-line title, date, release-tag link) to `#updates`, move the LATEST pill to it, and drop the oldest card so the list stays at six; full notes live on GitHub.

The 0.49.4 update adds **Settings → Providers → Account labels** for saved Codex and other provider accounts. Names save automatically on this Mac; Reset restores the default. Labels remain local, and renaming does not change connections, quotas, or history. The 0.49.3 update distinguishes unused Codex reset credits from credits usable for the current limits. An illustrative account may hold one unused credit while none apply now; the row says **0 usable now**, and details retain inventory and expiry information. When applicability is unreported, the count says **unused**. Quota, identity, reset count, and stale state stay scoped to the same account. The 0.49.2 update shows a Muse Code plan that Meta reports as exhausted as fully used until Meta's reported reset, instead of estimating remaining usage from local activity; failed plan checks back off for an hour and reuse one Muse session. The 0.49.1 update lets users choose a connected account under **More → Menu-bar provider → provider → account**. The circle remembers the selected account separately for each provider, independently of the CLI login and aggregate spend. For example, choose a personal or work Codex account; its weekly quota drives the circle, or its reported monthly quota when no weekly window is available. If that account is unavailable, the circle does not silently use another account’s quota. Saved Codex and Claude accounts refresh independently; account connections and labels remain local. See the app’s `docs/MIDAS_SETUP.md` for connection and display settings.

Public 0.49.4 archive SHA-256: `309232f7edc88376201fb72d3aaf36a48a71573fd051c834c0bd7a3fa9c309af`. The public archive, notarization, Gatekeeper, Sparkle signatures, and both latest feeds were verified before updating these links. Local installation and website production checks remain separate. The 0.49.4/SEO site commit `c75bcb9` reached production Ready; all 21 local and 21 production browser checks passed. See `docs/seo.md` for the metadata audit and production evidence.

The 0.48.4 update fixes cross-Mac sync for busy Macs: when a Mac’s history exceeds one publication (32 MiB / 100,000 records), older days are shared as per-day, per-model totals instead of being dropped, so combined totals include each Mac’s full history. See the app’s `docs/MIDAS_USAGE_SYNC.md`.

The 0.48.3 update adds an optional local preference to limit Codex usage to one OpenAI account. Quotas, cached readings, and cloud history remain account-scoped without fallback to another login. While scoped, totals exclude combined device history and local logs that cannot reliably identify the account; account-verified cloud history may be shorter or have unavailable dollar estimates. Other providers, saved connections, and shared-history contributions retain their behavior. See the app’s `docs/MIDAS_SETUP.md` for configuration.

The 0.48.2 label update shortens the overview total heading to **AI Spend**. Help text and More → Estimate details retain its API-rate estimate meaning. Amounts, recorded tokens, coverage, and separate billed-spend accounting are unchanged.

The 0.48.1 refinement removes inline Partial total/Partial estimate notices and makes the Meta recorded-activity fallback a compact overview summary. More → Estimate details retains missing-source, history, and pricing coverage, and provider details retain the activity breakdown. Observed plan windows, per-account limits, estimated values, recorded-token counting, and separate billed spend keep their existing rules. App publication and website production deployment are verified separately.

The 0.48.0 native redesign uses a compact, content-sized menu panel with fixed totals/actions and scrolling provider rows. Independent usage limits, percentages left, and resets remain visible beside provider estimates. SF Pro, SF Symbols, system colors, and the user’s accent replace custom app styling; macOS 26 adds one Liquid Glass navigation capsule, with a solid Reduce Transparency/older-system fallback. Usage and Settings use native sidebars, dates use a native menu, and coverage/sync details stay inside the panel with Back navigation. Recorded-token totals, separate billed spend, account boundaries, DGX Spark pricing coverage, and private sync retain their accounting rules. The website demo is illustrative; its web artwork is not a screenshot of the native app.

The 0.47.1 performance update reduces repeated shared-history allocations and encoding, keeps local session scans and recurring sync merges/saves away from the UI thread, and skips unchanged Codex cache writes. Its release entry makes no fixed memory-budget or percentage-reduction claim; startup cache restoration remains synchronous. Publish the versioned links only after the app release verification above is complete.

Optional usage sync combines recorded Codex, Claude Code, and Muse Code events through a private Tailscale hub or the same private shared folder selected in Settings → Sync on each Mac. The hub supports a Mac mini as the central service and numeric collectors on Linux, including DGX Spark. Each collector has a separate revocable usage credential. Macs using the same Apple Account can still use a dedicated iCloud Drive folder. Each verified Cursor account/day is counted once, and shared history uses UTC days. Combined scope appears in monthly charts, spend history, menu-bar totals, and widgets; it does not add Codex cloud totals to local events. OpenAI account identities, quotas, and reported cloud history stay independently displayed. Sign-ins, provider credentials, conversation text, and quota limits stay local. Sync contains numeric usage, costs, public model names, opaque identities, and device labels, so use a private folder or private hub with approved devices. Collection continues offline and exchanges retry later; the hub must be awake and reachable. A local save does not prove another Mac received it. Meta AI / the Muse consumer app has no verified numeric source and is currently unavailable. See the app’s `docs/MIDAS_USAGE_SYNC.md` and `docs/MIDAS_TAILSCALE_HUB.md` for the source and privacy contract.

DGX Spark has its own NVIDIA-branded provider card, showing a fixed rolling 30-day UTC token total from prospective local vLLM counter deltas. For supported, explicitly identified models with known token mix, Midas projects a named hosted API comparison. NVIDIA Qwen3.8-Flash-Next NVFP4 currently uses Lyceum’s Qwen3.8-Flash-Next reference: USD per million tokens 0.20 uncached input, 0.05 cached input, 0.50 output (checked October 17, 2026; https://lyceum.technology/models/qwen/qwen3.8-flash-next/). Cached input is already part of input; total tokens are input plus output. The local quantized model and hosted service can differ. This is an API-equivalent value, not a bill or actual savings. Unknown model or token mix remains unpriced; coverage is partial when records cannot be valued. Runtime lifetime counters are never invented as earlier daily history. The site describes this feature without fabricating a live Spark reading; the interactive demo stays illustrative.

Spend history includes per-provider monthly cost and token charts across 6 or 12 calendar months, with hover details and accessible records. Current-month comparisons use the same elapsed days in the previous month only when matching records are available. Missing history stays unavailable, and explicit zero stays zero. Supported sources can load up to 365 days; Codex cloud currently supplies 30 days and Mistral only its current month. Chart costs preserve the source’s estimate or billed label. The interactive site demo remains illustrative and does not include a monthly chart.

Claude supports separate personal and work sign-ins with verified emails and optional nicknames. Each saved account refreshes independently and shows its own 5-hour and all-model weekly limits, reset times, and errors. Model-specific weekly limits remain in account details. Claude Code spend is a provider-wide estimate from local activity; it is not attributed to individual saved accounts. The sign-in flow leaves the current Claude Code login unchanged.

Estimated spend is priced at public API rates and is never a bill. Orbit shows one provider-wide weekly allowance, or Cursor’s monthly allowance; model-specific and session quotas do not drive its ring. Meta stays out of Orbit; observed plan windows and explicitly labeled recorded-activity baselines remain separate. Unused reset inventory, current reset applicability, and scheduled weekly resets stay separate. Preserve those distinctions. All demo values are illustrative and provider spends sum to each period's total.

## Deploy

GitHub: https://github.com/enzo-prism/midas-site

Vercel project: `midas-by-prism`, team `enzo-design-prisms-projects`. Production deploys from `main` through the Vercel Git integration. To deploy manually, link explicitly with `vercel link --project midas-by-prism --scope enzo-design-prisms-projects`, then `vercel --prod`. Never commit `.vercel` or `.env` files. If changing the public domain, update canonical, Open Graph, robots, and sitemap URLs together.

## Credits

Midas is a fork of CodexBar by Peter Steinberger and contributors. Provider marks belong to their respective owners and do not imply endorsement. See THIRD_PARTY_NOTICES.md.

## Google Search Console

Canonical, Open Graph, robots, and sitemap URLs use `https://midas-ai.dev/`. The domain property `sc-domain:midas-ai.dev` is verified under the Prism Google account via Vercel DNS and linked to the dedicated Midas GA4 stream (`G-0WWYML8MTL`). The sitemap is submitted and fetched, and URL Inspection confirms the homepage is indexed with the correct canonical. Preserve the DNS ownership TXT and original Vercel-host HTML verification tag. See [docs/analytics.md](docs/analytics.md) for IDs, consent behavior, event settings, and verification limits.


## SEO maintenance

The homepage targets people looking for an AI usage tracker for Mac, including Claude, Codex,
and Cursor usage, quotas, resets, and API-rate spend estimates. The title, description, social
metadata, visible heading/lede, and structured app data describe the same product. Keep the
canonical URL, Open Graph URL, robots sitemap reference, and sitemap location on `midas-ai.dev`.
See [docs/seo.md](docs/seo.md) for the audit, metadata contract, verification, and release checklist.
Structured data must never invent ratings, reviews, user counts, or billed savings. The software
entity describes the app; it does not establish eligibility for a Google software-app rich result.
