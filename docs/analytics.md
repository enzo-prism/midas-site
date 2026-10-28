# Website measurement

Configured October 27, 2026, under Prism's existing Google account (`enzo@design-prism.com`). These are public resource identifiers, not credentials.

| Resource | Value |
| --- | --- |
| GA account | Prism, `273228361` |
| GA4 property | Midas — midas-ai.dev, `561132189` |
| Web stream | Midas website, `16218741250` |
| Measurement ID | `G-0WWYML8MTL` |
| Canonical stream URL | `https://midas-ai.dev/` |
| Time zone / currency | America/Los_Angeles / USD |
| Search Console | Domain property `sc-domain:midas-ai.dev` |
| Sitemap | `https://midas-ai.dev/sitemap.xml` |

## Collection contract

`src/analytics.ts` loads one Google tag only on `midas-ai.dev`, after explicit analytics opt-in. Localhost and Vercel preview hosts never send GA4 traffic. There is no GTM container or second GA4 integration. The banner offers equal Allow analytics / No thanks buttons; footer Analytics preferences reopens it. The choice lasts 180 days in localStorage; blocked storage falls back to this visit. Withdrawal disables the tag, deletes this site's GA cookies, and reloads. Other tabs reload when the choice changes.

Basic consent mode defaults analytics and all three advertising consent types to denied; only analytics becomes granted. Google signals and advertising personalization are disabled in tag configuration. GA cookies expire after 180 days without refreshing on activity. No User-ID, app usage, saved account labels, prompts, or provider credentials are sent. Stream-level email redaction and sensitive query-key redaction (`email`, `token`, `code`, `key`, `password`, `user_id`) are enabled. Campaign parameters remain available for attribution; never put private data in URLs.

Enhanced measurement is enabled for outbound clicks, scrolls, file downloads, and browser history changes. Search, video and form collection are disabled because this page has no corresponding product flows. The normal config sends the initial page view; do not add a second manual page_view. `file_download` is a key event, counted once per event. A click is not proof of download completion, installation or app use. No custom parallel download event duplicates it.

GA4 event retention is two months. Vercel's existing cookieless Web Analytics remains separate. `/privacy.html` discloses both tools, cookies, purpose and withdrawal. It has no analytics tag and is noindex/follow, so the sitemap continues listing only the marketing homepage.

## Search ownership and association

The domain property was verified via an apex TXT record in the existing Vercel DNS zone. Preserve that `google-site-verification` record and the legacy HTML verification tag. The original `https://midas-by-prism.vercel.app/` URL-prefix property remains intact. The domain property covers protocols/subdomains, and is associated with the Midas GA4 web stream.

Sitemap submission and read-back succeeded: one web URL, fetched by Google. URL Inspection returned PASS, Submitted and indexed, INDEXING_ALLOWED, fetch SUCCESSFUL, robots ALLOWED, and both Google/user canonical `https://midas-ai.dev/`. Google's recorded crawl was October 12, 2026; this does not prove the latest copy has been recrawled. Newly added property reports need processing time.

## Verify and maintain

Run `pnpm build` and all browser tests before pushing main. Consent tests proxy local source under the canonical origin and stub the Google tag, preventing test traffic. They check default blocking, refusal persistence, one tag/config, expiry, withdrawal/cookie removal and preview exclusion. For public smoke tests, run `BASE_URL=https://midas-ai.dev pnpm test`; tests similarly stub Google.

After deployment, use a real browser to opt in and click the actual app ZIP link once, then verify page_view and file_download in the dedicated GA4 Realtime report. Do not count this verification visit as a customer conversion. Google reports can lag; absence immediately after an event is not proof of failure. GSC performance data and the GA4 Search Console reports need additional processing. Keep website analytics separate from the private Midas usage hub.

- [GA4 property](https://analytics.google.com/analytics/web/#/a273228361p561132189/)
- [Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Amidas-ai.dev)
- [Google basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Google consent implementation](https://developers.google.com/tag-platform/security/guides/consent)
- [GA4/Search Console linking](https://support.google.com/analytics/answer/10737381)

## Production evidence

Implementation commit `6f465aad04a544faca758724981cd16a2c136218` deployed Ready as
`dpl_64WteKp5Yj3TaAGAeafhRaKMNKu8` on the canonical domain. A real opt-in visit and
app ZIP click appeared in both the GA4 Realtime API and dashboard: one page_view,
one file_download key event, and the corresponding outbound click, first_visit and
session_start. This is setup/test traffic, not a customer installation. The Search Console
Queries and Google organic search traffic reports are visible in GA4 navigation, and
the reports snapshot uses the Marketing performance template. GSC shows sitemap
Success with one discovered page. Standard reports still need Google processing time.

Build and all 23 local checks passed. All 23 production checks passed after the
consent-test proxy was limited to local runs and in-flight request cleanup was fixed;
the final two consent tests were also rerun locally. No Google collection occurs
during the automated suite. The public privacy notice is served with noindex/follow.
