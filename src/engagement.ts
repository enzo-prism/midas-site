import { track } from '@vercel/analytics';
import { onAnalyticsReady, trackEvent } from './analytics';

/**
 * Page-level engagement events. GA4 events need opt-in (see analytics.ts); the cookieless Vercel
 * `Download` event counts every visitor's download click. GA4 keeps counting the download itself as
 * the enhanced-measurement `file_download` key event; `cta_click` only adds where the click happened.
 */
export function initEngagement() {
  document.addEventListener('click', event => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-cta]');
    // Send-to-Mac buttons on phones record their own `send_to_mac` event (see mobile.ts).
    if (!link || link.classList.contains('is-handoff')) return;
    const cta = link.dataset.cta!;
    const location = link.dataset.ctaLocation!;
    trackEvent('cta_click', { cta, cta_location: location });
    if (cta === 'download') track('Download', { location });
  });

  // One section_view per section per page, once it has stayed in the upper half of the viewport for
  // a second in a visible tab. Sections a smooth nav jump scrolls past are not counted. Sections
  // seen before consent are resent when the visitor opts in.
  const dwell = 1000;
  const sent = new Set<string>();
  const timers = new Map<Element, number>();
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const watcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      const section = target.dataset.section!;
      clearTimeout(timers.get(target));
      timers.delete(target);
      if (!entry.isIntersecting || sent.has(section)) continue;
      timers.set(target, window.setTimeout(() => {
        timers.delete(target);
        if (document.hidden || sent.has(section) || !trackEvent('section_view', { section })) return;
        sent.add(section);
        watcher.unobserve(target);
      }, dwell));
    }
  }, { rootMargin: '0px 0px -50% 0px' });
  // Re-observing delivers a fresh entry for each section, restarting its timer if it is on screen.
  const watch = () => sections.forEach(section => {
    if (sent.has(section.dataset.section!)) return;
    watcher.unobserve(section);
    watcher.observe(section);
  });
  watch();
  onAnalyticsReady(watch);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) watch(); });

  document.querySelectorAll<HTMLDetailsElement>('.faq-items details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) trackEvent('faq_open', { question: item.querySelector('summary')!.textContent!.trim() });
  }));
}

/** A visitor used a live demo control (never fired by the autoplaying recording). */
export const trackDemo = (control: string, choice = '') => trackEvent('demo_interact', choice ? { control, choice } : { control });
