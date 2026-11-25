# Midas marketing website

Use pnpm and preserve the lockfile. Source is static HTML, TypeScript, and CSS built with Vite.
Run `pnpm build` and `pnpm test` before publishing UI changes. Never embed credentials or real usage/account data.
`src/ascii-crown.ts` owns the decorative canvas; honor reduced motion, visibility, and off-screen suspension.
The `span.pixel-crown` brand mark owns its own CSS-only animation (see `docs/crown.md`); keep its 25x22 box (20x18 in the footer), use transform/filter/opacity only, and keep the Reduce Motion static fallback. Never touch both crown systems in one change.
Keep product claims consistent with enzo-prism/midas. Demo values must be labeled illustrative.
Deploy only to this project's linked Vercel project. The app repo and Prism reference repo are separate.
The site is dark only and visual-first: no theme toggle or light tokens, short headings and one-line captions, live components over paragraphs. Every animation needs a Reduce Motion fallback and must pause off-screen. Hero demo spends must sum to each period's total.
Content pages (`claude.html`, `codex.html`, `cursor.html`, `gemini.html`, `providers.html`, `ai-spend.html`) are the text exception to visual-first, for search and answer engines. Shared markup lives in `partials/` (`<!-- @include name -->`); FAQPage JSON-LD is generated from the visible FAQ, so never hand-write it. Keep each page's sitemap `lastmod` equal to its WebPage `dateModified`, and keep `public/llms.txt` in sync with the pages. Check provider claims against the app repo at the release tag. See `docs/seo.md`.
Phones and other non-Macs get Send to my Mac instead of the ZIP (`src/mobile.ts`); keep the real archive hrefs in the HTML and the `.handoff-direct` fallback. Keep tap targets at least 44px and text at least 10px on phones; `tests/mobile.spec.ts` enforces it. The tests run against `http://127.0.0.1:4173` (`pnpm dev --port 4173 --strictPort`).
