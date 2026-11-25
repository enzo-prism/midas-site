import { track } from '@vercel/analytics';
import { trackEvent } from './analytics';

/**
 * Phones, tablets, and other non-Mac devices can't run Midas, so their download buttons send the
 * link to the visitor's Mac (share sheet: AirDrop, Messages, Mail) instead of saving a macOS ZIP on
 * the phone. The page HTML keeps the real archive links for crawlers, desktop Macs, and no-JS visits.
 */
export const handoffUrl = 'https://midas-ai.dev/#download';

/** True when this device cannot install a macOS app. iPadOS reports a Mac user agent, so touch decides. */
export function cannotRunMidas(nav: Navigator = navigator) {
  const ua = nav.userAgent;
  if (/iPhone|iPad|iPod|Android|CrOS|Windows|Linux/i.test(ua) && !/Macintosh/i.test(ua)) return true;
  return /Macintosh/i.test(ua) && nav.maxTouchPoints > 1;
}

let toastTimer = 0;
/** One polite status line near the bottom of the screen. */
export function toast(message: string) {
  let element = document.querySelector<HTMLElement>('#site-toast');
  if (!element) {
    element = document.createElement('p');
    element.id = 'site-toast';
    element.className = 'site-toast';
    element.setAttribute('role', 'status');
    document.body.append(element);
  }
  element.textContent = message;
  element.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element!.classList.remove('is-on'), 4200);
}

async function sendToMac(location: string) {
  const data = { title: 'Midas for Mac', text: 'Midas, the free AI usage tracker for your Mac menu bar:', url: handoffUrl };
  let method = 'copy';
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      method = 'share';
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(handoffUrl);
      toast('Link copied. Open it on your Mac to download Midas.');
    }
  } catch (error) {
    // Dismissing the share sheet is not a failure; anything else falls back to showing the link.
    if ((error as DOMException)?.name === 'AbortError') return;
    method = 'manual';
    toast(`Open ${handoffUrl.replace('https://', '').replace('/#download', '')} on your Mac to download Midas.`);
  }
  trackEvent('send_to_mac', { cta_location: location, method });
  track('Send to Mac', { location, method });
}

function initHandoff() {
  if (!cannotRunMidas()) return;
  document.documentElement.classList.add('is-handoff');
  document.querySelectorAll<HTMLAnchorElement>('a.download-link').forEach(link => {
    link.dataset.archive = link.href;
    link.href = handoffUrl;
    link.classList.add('is-handoff');
    link.setAttribute('aria-label', 'Send the Midas download link to your Mac');
    link.querySelector('[data-lucide="download"]')?.setAttribute('data-lucide', 'send');
    // Replace only the text, keeping the icon.
    const label = [...link.childNodes].reverse().find(node => node.nodeType === Node.TEXT_NODE && node.textContent!.trim());
    if (label) label.textContent = ' Send to my Mac';
    link.addEventListener('click', event => {
      event.preventDefault();
      void sendToMac(link.dataset.ctaLocation ?? 'unknown');
    });
    // Still let someone take the archive itself (for example, to AirDrop the file).
    const direct = document.createElement('a');
    direct.className = 'handoff-direct';
    direct.href = link.dataset.archive;
    direct.dataset.cta = 'download';
    direct.dataset.ctaLocation = `${link.dataset.ctaLocation ?? 'unknown'}_direct`;
    direct.textContent = 'or download the ZIP here';
    const anchor = link.closest('.hero-actions') ?? link;
    anchor.after(direct);
  });
}

/** Below 960px the header links move into a menu sheet opened by the menu button. */
function initMenu() {
  const shell = document.querySelector<HTMLElement>('.header-shell');
  const button = shell?.querySelector<HTMLButtonElement>('.menu-button');
  const nav = shell?.querySelector<HTMLElement>('.header nav');
  if (!shell || !button || !nav) return;
  const set = (open: boolean) => {
    shell.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  button.addEventListener('click', () => {
    const open = !shell.classList.contains('menu-open');
    set(open);
    if (open) nav.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
  });
  nav.addEventListener('click', event => { if ((event.target as Element).closest('a')) set(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && shell.classList.contains('menu-open')) { set(false); button.focus(); }
  });
  document.addEventListener('click', event => {
    if (shell.classList.contains('menu-open') && !shell.contains(event.target as Node)) set(false);
  });
  matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) set(false); });
}

/** Runs before icons render, so swapped icon names are drawn. */
export function initMobile() {
  initHandoff();
  initMenu();
}
