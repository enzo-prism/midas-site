import './style.css';
import {
  createIcons, ArrowUpRight, ArrowDown, ArrowDownRight, Download, Sun, Moon, Command, Wifi, BatteryFull, Star, Plus,
  Calendar, ChevronDown, User, Ticket, Coins, Users, Cloud, ShieldCheck, EyeOff, Layers, Gauge, Info, Check, X,
  FolderOpen, Sparkles,
} from 'lucide';
import { inject } from '@vercel/analytics';
import { mountAsciiCrown } from './ascii-crown';
inject();
createIcons({ icons: {
  ArrowUpRight, ArrowDown, ArrowDownRight, Download, Sun, Moon, Command, Wifi, BatteryFull, Star, Plus,
  Calendar, ChevronDown, User, Ticket, Coins, Users, Cloud, ShieldCheck, EyeOff, Layers, Gauge, Info, Check, X,
  FolderOpen, Sparkles,
} });

const themeButton = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let savedTheme: string | null = null;
try { savedTheme = localStorage.getItem('midas-theme'); } catch { /* Browsing without storage is supported. */ }
function setTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10120f' : '#f7f7f2');
  window.dispatchEvent(new Event('midas:theme'));
}
setTheme(document.documentElement.dataset.theme || 'light');
themeButton.addEventListener('click', () => {
  savedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(savedTheme);
  try { localStorage.setItem('midas-theme', savedTheme); } catch { /* Theme still works in this session. */ }
});
systemTheme.addEventListener('change', event => { if (savedTheme !== 'light' && savedTheme !== 'dark') setTheme(event.matches ? 'dark' : 'light'); });

// Illustrative demo data. Provider spends sum to each period's total; none of it comes from real accounts.
type ProviderKey = 'codex' | 'cursor' | 'meta';
const providers: Record<ProviderKey, { name: string; label: string; quota: string; percent: number | null }> = {
  codex: { name: 'Codex', label: 'Weekly remaining', quota: '72% left', percent: 72 },
  cursor: { name: 'Cursor', label: 'Reported quota', quota: '64% left', percent: 64 },
  meta: { name: 'Meta', label: 'Remaining quota', quota: 'Not reported', percent: null },
};
const periods: { name: string; range: string; total: string; orbit: string; spend: Record<ProviderKey, string> }[] = [
  { name: 'This month', range: 'Sep 1 – 13', total: '$248.60', orbit: '$248', spend: { codex: '$186.40', cursor: '$42.80', meta: '$19.40' } },
  { name: 'Last 30 days', range: 'Aug 14 – Sep 13', total: '$412.15', orbit: '$412', spend: { codex: '$309.75', cursor: '$71.20', meta: '$31.20' } },
  { name: 'August', range: 'Aug 1 – 31', total: '$389.70', orbit: '$389', spend: { codex: '$291.30', cursor: '$66.90', meta: '$31.50' } },
];
let activeProvider: ProviderKey = 'codex';
let activePeriod = 0;
const quotaValue = document.querySelector<HTMLElement>('#quota-value')!;
quotaValue.setAttribute('aria-live', 'polite');
const providerSpend = document.querySelector<HTMLElement>('#provider-spend')!;
const accounts = document.querySelector<HTMLElement>('#preview-accounts')!;

function renderProvider() {
  const provider = providers[activeProvider];
  document.querySelectorAll('[data-provider]').forEach(item => item.setAttribute('aria-pressed', String((item as HTMLElement).dataset.provider === activeProvider)));
  document.querySelector('#preview-name')!.textContent = provider.name;
  providerSpend.textContent = periods[activePeriod].spend[activeProvider];
  document.querySelector('#quota-label')!.textContent = provider.label;
  quotaValue.textContent = provider.quota;
  document.querySelector<HTMLElement>('#quota-bar')!.style.setProperty('--fill', `${provider.percent ?? 0}%`);
  accounts.hidden = activeProvider !== 'codex';
  for (const id of ['preview-logo', 'orbit-logo']) {
    const logo = document.querySelector<HTMLImageElement>(`#${id}`)!;
    logo.src = `/providers/${activeProvider}.svg`;
    logo.classList.toggle('preserve-color', activeProvider === 'meta');
    if (id === 'orbit-logo') logo.alt = `${provider.name} favorite provider`;
  }
  const ring = document.querySelector<HTMLElement>('#orbit-ring')!;
  ring.style.borderStyle = provider.percent === null ? 'dashed' : 'solid';
  ring.style.borderColor = provider.percent === null ? 'var(--muted)' : '';
}
function renderPeriod() {
  const period = periods[activePeriod];
  document.querySelector('#period-name')!.textContent = period.name;
  document.querySelector('#period-range')!.textContent = period.range;
  document.querySelector('.preview-total')!.textContent = period.total;
  document.querySelector('#orbit-spend')!.textContent = period.orbit;
  providerSpend.textContent = period.spend[activeProvider];
}
document.querySelectorAll<HTMLButtonElement>('[data-provider]').forEach(button => {
  button.addEventListener('click', () => { activeProvider = button.dataset.provider as ProviderKey; renderProvider(); });
});
document.querySelector<HTMLButtonElement>('#period-chip')!.addEventListener('click', () => {
  activePeriod = (activePeriod + 1) % periods.length;
  renderPeriod();
});

// Scroll reveal and active nav, both driven by IntersectionObserver.
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window) {
  const revealer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      // Anything already scrolled past (e.g. after a nav jump) is shown immediately rather than left blank.
      if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
      entry.target.classList.add('is-visible');
      revealer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealTargets.forEach(target => revealer.observe(target));
  // IntersectionObserver only reports threshold crossings, so a long jump (nav link, find-in-page) can skip
  // elements entirely. Sweep anything left above the viewport after each scroll settles.
  let pending = new Set<HTMLElement>(revealTargets);
  let sweepScheduled = false;
  window.addEventListener('scroll', () => {
    if (sweepScheduled || pending.size === 0) return;
    sweepScheduled = true;
    requestAnimationFrame(() => {
      sweepScheduled = false;
      pending = new Set([...pending].filter(target => !target.classList.contains('is-visible')));
      for (const target of pending) {
        if (target.getBoundingClientRect().bottom < 0) { target.classList.add('is-visible'); revealer.unobserve(target); }
      }
    });
  }, { passive: true });
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.header nav a[href^="#"]')];
  const sections = navLinks.map(link => document.querySelector<HTMLElement>(link.hash)).filter((section): section is HTMLElement => section !== null);
  const spotter = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    for (const link of navLinks) {
      if (link.hash === `#${visible.target.id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.2, 0.5] });
  sections.forEach(section => spotter.observe(section));
} else {
  revealTargets.forEach(target => target.classList.add('is-visible'));
}

const cleanup = mountAsciiCrown(document.querySelector<HTMLCanvasElement>('#ascii-crown')!);
window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); });
