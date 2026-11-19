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
    if (!link) return;
    const cta = link.dataset.cta!;
    const location = link.dataset.ctaLocation!;
    trackEvent('cta_click', { cta, cta_location: location });
    if (cta === 'download') track('Download', { location });
  });

  // One section_view per section per page, once its top reaches the upper half of the viewport.
  // Sections seen before consent are resent when the visitor opts in.
  const sent = new Set<string>();
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  const watcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const section = (entry.target as HTMLElement).dataset.section!;
      if (!entry.isIntersecting || sent.has(section)) continue;
      if (!trackEvent('section_view', { section })) continue;
      sent.add(section);
      watcher.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -50% 0px' });
  const watch = () => sections.forEach(section => {
    if (sent.has(section.dataset.section!)) return;
    watcher.unobserve(section);
    watcher.observe(section);
  });
  watch();
  onAnalyticsReady(watch);

  document.querySelectorAll<HTMLDetailsElement>('.faq-items details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) trackEvent('faq_open', { question: item.querySelector('summary')!.textContent!.trim() });
  }));
}

/** A visitor used a live demo control (never fired by the autoplaying recording). */
export const trackDemo = (control: string, choice = '') => trackEvent('demo_interact', choice ? { control, choice } : { control });
