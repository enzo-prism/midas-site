import './style.css';
import { createIcons, ArrowUpRight, ArrowDown, ArrowDownRight, Download, Sun, Moon, Command, Wifi, BatteryFull, Star, ScanLine, Orbit, Terminal, Plus } from 'lucide';
import { inject } from '@vercel/analytics';
import { mountAsciiCrown } from './ascii-crown';
inject();
createIcons({ icons: { ArrowUpRight, ArrowDown, ArrowDownRight, Download, Sun, Moon, Command, Wifi, BatteryFull, Star, ScanLine, Orbit, Terminal, Plus } });
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
const providers = {
  codex: { name: 'Codex', spend: '$186.40', label: 'Weekly remaining', quota: '72% left', percent: 72 },
  cursor: { name: 'Cursor', spend: '$42.80', label: 'Reported quota', quota: '64% left', percent: 64 },
  meta: { name: 'Meta', spend: '$19.40', label: 'Remaining quota', quota: 'Not reported', percent: null },
};
const quotaValue = document.querySelector<HTMLElement>('#quota-value')!;
quotaValue.setAttribute('aria-live', 'polite');
document.querySelectorAll<HTMLButtonElement>('[data-provider]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.provider as keyof typeof providers;
    const provider = providers[key];
    document.querySelectorAll('[data-provider]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#preview-name')!.textContent = provider.name;
    document.querySelector('#provider-spend')!.textContent = provider.spend;
    document.querySelector('#quota-label')!.textContent = provider.label;
    quotaValue.textContent = provider.quota;
    document.querySelector<HTMLElement>('#quota-bar')!.style.width = `${provider.percent ?? 0}%`;
    for (const id of ['preview-logo', 'orbit-logo']) {
      const logo = document.querySelector<HTMLImageElement>(`#${id}`)!;
      logo.src = `/providers/${key}.svg`;
      logo.classList.toggle('preserve-color', key === 'meta');
      if (id === 'orbit-logo') logo.alt = `${provider.name} favorite provider`;
    }
    const ring = document.querySelector<HTMLElement>('#orbit-ring')!;
    ring.style.borderStyle = provider.percent === null ? 'dashed' : 'solid';
    ring.style.borderColor = provider.percent === null ? 'var(--muted)' : '';
  });
});
const cleanup = mountAsciiCrown(document.querySelector<HTMLCanvasElement>('#ascii-crown')!);
window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); });
