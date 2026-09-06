# Midas marketing website

Use pnpm and preserve the lockfile. Source is static HTML, TypeScript, and CSS built with Vite.
Run `pnpm build` and `pnpm test` before publishing UI changes. Never embed credentials or real usage/account data.
`src/ascii-crown.ts` owns the decorative canvas; honor reduced motion, visibility, and off-screen suspension.
The `span.pixel-crown` brand mark owns its own CSS-only animation (see `docs/crown.md`); keep its 25x22 box (16x14 in preview), use transform/filter/opacity only, and keep the Reduce Motion static fallback. Never touch both crown systems in one change.
Keep product claims consistent with enzo-prism/midas. Demo values must be labeled illustrative.
Deploy only to this project's linked Vercel project. The app repo and Prism reference repo are separate.
