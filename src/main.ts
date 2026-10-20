import './style.css';
import {
  createIcons, Crown, RotateCw, Settings, Ellipsis, ChevronDown, Ticket, RefreshCcw, ChartColumn, Wifi, BatteryFull,
  ArrowUpRight, ArrowDown, Download, KeyRound, MessageSquareOff, Package, Plus, EyeOff, Network, UserX, Hash, History,
  Server, Laptop, Monitor, FileArchive, FolderOpen, Sparkles,
} from 'lucide';
import { inject } from '@vercel/analytics';
import { mountAsciiCrown } from './ascii-crown';
inject();
createIcons({ icons: {
  Crown, RotateCw, Settings, Ellipsis, ChevronDown, Ticket, RefreshCcw, ChartColumn, Wifi, BatteryFull,
  ArrowUpRight, ArrowDown, Download, KeyRound, MessageSquareOff, Package, Plus, EyeOff, Network, UserX, Hash, History,
  Server, Laptop, Monitor, FileArchive, FolderOpen, Sparkles,
} });

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector)!;
const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const money = (value: number) => `$${value.toFixed(2)}`;

/** Tweens a number into an element's text; instant under Reduce Motion. */
function tween(element: Element, from: number, to: number, format: (value: number) => string, duration = 900) {
  if (reduceMotion.matches || duration <= 0) { element.textContent = format(to); return; }
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------------------------
// Hero: an illustrative menu-bar panel that plays like a screen recording.
// Provider spends sum to each period's total; none of it comes from real accounts.
type ProviderKey = 'codex' | 'claude' | 'cursor' | 'meta';
const periods: { name: string; total: number; tokens: number; spend: Record<ProviderKey, number> }[] = [
  { name: 'This month', total: 391.35, tokens: 184.2, spend: { codex: 186.40, claude: 142.75, cursor: 42.80, meta: 19.40 } },
  { name: 'Last 30 days', total: 633.45, tokens: 296.8, spend: { codex: 309.75, claude: 221.30, cursor: 71.20, meta: 31.20 } },
];
const stage = $('#stage');
const panel = $('#panel');
const cursor = $('#cursor');
const clickRing = $('#click-ring');
const orbitItem = $<HTMLButtonElement>('#orbit-item');
const periodButton = $<HTMLButtonElement>('#period-button');
let activePeriod = 0;

function setPanel(open: boolean) {
  panel.classList.toggle('is-open', open);
  orbitItem.setAttribute('aria-expanded', String(open));
}
function setPeriod(index: number, duration = 900) {
  const from = periods[activePeriod];
  const to = periods[index];
  activePeriod = index;
  $('#period-name').textContent = to.name;
  tween($('#panel-total'), from.total, to.total, money, duration);
  tween($('#panel-tokens'), from.tokens, to.tokens, value => `${value.toFixed(1)}M`, duration);
  tween($('#orbit-spend'), from.total, to.total, value => `$${Math.floor(value)}`, duration);
  for (const key of Object.keys(to.spend) as ProviderKey[]) {
    tween($(`[data-spend="${key}"]`), from.spend[key], to.spend[key], money, duration);
  }
}
function showFilled() {
  stage.classList.add('is-filled');
  setPanel(true);
  stage.classList.add('show-callouts');
}

/** Position relative to the stage, from layout offsets so the stage's 3D tilt never skews it. */
function pointOf(element: HTMLElement, dx = 0.5, dy = 0.5) {
  let x = element.offsetWidth * dx;
  let y = element.offsetHeight * dy;
  let node: HTMLElement | null = element;
  while (node && node !== stage) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y };
}
function moveCursor(element: HTMLElement, dx = 0.5, dy = 0.5) {
  const { x, y } = pointOf(element, dx, dy);
  cursor.style.transform = `translate(${x - 5}px, ${y - 3}px)`;
  clickRing.style.left = `${x}px`;
  clickRing.style.top = `${y}px`;
}
function clickPulse() {
  clickRing.classList.remove('is-on');
  void clickRing.offsetWidth;
  clickRing.classList.add('is-on');
}

let generation = 0;
let stageVisible = false;
let resumeTimer = 0;
const waitUntilWatched = async (run: number) => {
  while (run === generation && (!stageVisible || document.hidden)) await sleep(250);
};
async function autoplay() {
  const run = ++generation;
  stage.classList.add('is-playing');
  const live = () => run === generation;
  const step = async (ms: number) => { await sleep(ms); await waitUntilWatched(run); return live(); };
  const row = (name: string) => $(`[data-row="${name}"]`);
  while (live()) {
    // Reset to a closed menu.
    stage.classList.remove('show-callouts', 'is-filled');
    setPanel(false);
    if (activePeriod !== 0) setPeriod(0, 0);
    cursor.style.transform = `translate(${stage.offsetWidth * 0.42}px, ${stage.offsetHeight * 0.62}px)`;
    if (!await step(900)) return;
    moveCursor(orbitItem, 0.35);
    if (!await step(1100)) return;
    clickPulse(); setPanel(true);
    if (!await step(250)) return;
    stage.classList.add('is-filled');
    tween($('#panel-total'), 0, periods[0].total, money, 1300);
    if (!await step(1100)) return;
    stage.classList.add('show-callouts');
    if (!await step(2200)) return;
    moveCursor(periodButton);
    if (!await step(1100)) return;
    clickPulse(); setPeriod(1);
    if (!await step(2200)) return;
    moveCursor(row('claude'), 0.62, 0.45); row('claude').classList.add('is-hover');
    if (!await step(1800)) return;
    row('claude').classList.remove('is-hover');
    moveCursor($('.refresh-icon'));
    if (!await step(1100)) return;
    clickPulse(); panel.classList.add('is-refreshing');
    if (!await step(900)) return;
    panel.classList.remove('is-refreshing');
    moveCursor(periodButton);
    if (!await step(1000)) return;
    clickPulse(); setPeriod(0);
    if (!await step(2000)) return;
    stage.classList.remove('show-callouts');
    moveCursor(orbitItem, 0.35);
    if (!await step(1000)) return;
    clickPulse(); setPanel(false);
    if (!await step(1500)) return;
  }
}
function takeOver() {
  // A real visitor is driving: stop the recording, keep the open panel, resume after a quiet spell.
  if (stage.classList.contains('is-playing')) {
    generation++;
    stage.classList.remove('is-playing');
    panel.classList.remove('is-refreshing');
    document.querySelectorAll('.prow.is-hover').forEach(item => item.classList.remove('is-hover'));
    stage.classList.add('is-filled', 'show-callouts');
  }
  clearTimeout(resumeTimer);
  if (!reduceMotion.matches) resumeTimer = window.setTimeout(() => { void autoplay(); }, 9000);
}
orbitItem.addEventListener('click', event => { if (event.isTrusted) { takeOver(); setPanel(!panel.classList.contains('is-open')); } });
periodButton.addEventListener('click', event => {
  if (!event.isTrusted) return;
  takeOver();
  setPeriod((activePeriod + 1) % periods.length);
});
new IntersectionObserver(([entry]) => {
  stageVisible = Boolean(entry?.isIntersecting);
  if (stageVisible) stage.classList.add('is-flat');
}, { threshold: 0.25 }).observe(stage);
const startHero = () => {
  generation++;
  if (reduceMotion.matches) { stage.classList.remove('is-playing'); showFilled(); } else void autoplay();
};
reduceMotion.addEventListener('change', startHero);
startHero();

// ---------------------------------------------------------------------------------------------
// Bento: count-ups, a live reset countdown, and the monthly chart.
function countUp(element: HTMLElement) {
  const target = Number(element.dataset.count);
  const decimals = (element.dataset.count!.split('.')[1] ?? '').length;
  const prefix = element.dataset.prefix ?? '';
  const suffix = element.dataset.suffix ?? '';
  tween(element, 0, target, value => `${prefix}${value.toFixed(decimals)}${suffix}`, 1600);
}
const countdowns = [...document.querySelectorAll<HTMLElement>('[data-countdown]')];
const remaining = new Map(countdowns.map(element => [element, Number(element.dataset.countdown)]));
const clock = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
setInterval(() => {
  if (document.hidden) return;
  for (const element of countdowns) {
    if (!element.closest('.in-view')) continue;
    const next = (remaining.get(element)! - 1 + 18000) % 18000;
    remaining.set(element, next);
    element.textContent = clock(next);
  }
}, 1000);

// Illustrative monthly history. Nov and Dec have no records, so they render as unavailable, not zero.
const months = ['N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'];
const monthly = {
  cost: [null, null, [42, 18, 9], [61, 26, 12], [74, 40, 15], [92, 51, 18], [118, 66, 22], [149, 84, 28], [184, 102, 33], [236, 131, 41], [271, 168, 52], [186, 143, 43]],
  tokens: [null, null, [21, 8, 5], [30, 12, 6], [37, 19, 8], [45, 24, 9], [57, 31, 11], [70, 39, 14], [86, 47, 16], [108, 61, 20], [124, 78, 25], [88, 66, 21]],
} as const;
type Metric = keyof typeof monthly;
const chart = $('#chart');
chart.innerHTML = months.map((month, index) =>
  `<div class="col${monthly.cost[index] ? '' : ' missing'}${index === months.length - 1 ? ' now' : ''}"><i></i><i></i><i></i><span>${month}</span></div>`).join('');
function renderChart(metric: Metric, grow = true) {
  const series = monthly[metric];
  const max = Math.max(...series.map(values => (values ? values.reduce((a, b) => a + b, 0) : 0)));
  chart.querySelectorAll<HTMLElement>('.col').forEach((column, index) => {
    const values = series[index];
    const bars = column.querySelectorAll<HTMLElement>('i');
    bars.forEach((bar, provider) => {
      if (!values) { bar.style.height = provider === 0 ? '18%' : '0'; return; }
      bar.style.height = grow ? `${(values[provider] / max) * 100}%` : '0';
    });
  });
}
renderChart('cost', false);
document.querySelectorAll<HTMLButtonElement>('[data-metric]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-metric]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderChart(button.dataset.metric as Metric);
}));

// Illustrative DGX Spark daily tokens. Days before collection started stay unpriced stubs, not zeros.
$('#spark-bars').innerHTML = Array.from({ length: 30 }, (_, day) => day < 4
  ? '<i class="none"></i>'
  : `<i style="--h:${Math.round(28 + 60 * Math.abs(Math.sin(day * 1.7)) * (0.55 + day / 60))}%;transition-delay:${day * 18}ms"></i>`).join('');

// Cursor-follow glow on cards.
document.querySelectorAll<HTMLElement>('.card').forEach(card => card.addEventListener('pointermove', event => {
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  card.style.setProperty('--my', `${event.clientY - rect.top}px`);
}));

// ---------------------------------------------------------------------------------------------
// Menu-bar modes: auto-advances with a progress underline until a visitor picks one.
const captions: Record<string, string> = {
  orbit: 'Your total, plus one ring for your favorite’s weekly allowance.',
  ledger: 'Just the number. The menu bar stays quiet.',
  focus: 'One provider’s remaining quota, pinned.',
  constellation: 'Up to three readings. A dash when there’s no quota.',
};
const modesStage = $('.modes-stage');
const modeView = $('#mode-view');
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-mode]:is(button)')];
function selectMode(mode: string) {
  tabs.forEach(tab => {
    tab.setAttribute('aria-selected', String(tab.dataset.mode === mode));
    tab.tabIndex = tab.dataset.mode === mode ? 0 : -1;
  });
  modeView.dataset.mode = mode;
  const caption = $('#mode-caption');
  caption.textContent = captions[mode];
  caption.style.animation = 'none';
  void caption.offsetWidth;
  caption.style.animation = '';
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => { modesStage.classList.add('is-paused'); selectMode(tab.dataset.mode!); });
  tab.addEventListener('keydown', event => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!offset) return;
    const next = tabs[(index + offset + tabs.length) % tabs.length];
    next.focus(); next.click();
  });
  tab.querySelector('.tab-progress')!.addEventListener('animationend', () => {
    if (!modesStage.classList.contains('is-paused')) selectMode(tabs[(index + 1) % tabs.length].dataset.mode!);
  });
});
selectMode('orbit');
const syncModesMotion = () => modesStage.classList.toggle('is-paused', reduceMotion.matches || modesStage.classList.contains('is-paused'));
reduceMotion.addEventListener('change', syncModesMotion);
syncModesMotion();
new IntersectionObserver(([entry]) => {
  modesStage.querySelectorAll<HTMLElement>('.tab-progress').forEach(bar => { bar.style.animationPlayState = entry?.isIntersecting ? 'running' : 'paused'; });
}).observe(modesStage);
const privacy = $<HTMLButtonElement>('#privacy-toggle');
privacy.addEventListener('click', () => {
  const on = privacy.getAttribute('aria-pressed') !== 'true';
  privacy.setAttribute('aria-pressed', String(on));
  modeView.classList.toggle('is-private', on);
});

// ---------------------------------------------------------------------------------------------
// Scroll reveal, live bits on entry, sticky-header state, and active-section nav.
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');
const enter = (target: HTMLElement) => {
  if (target.classList.contains('in-view')) return;
  target.classList.add('in-view');
  target.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
  if (target.querySelector('#chart')) renderChart(($('[data-metric][aria-pressed="true"]') as HTMLElement).dataset.metric as Metric);
};
const revealer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    // Anything already scrolled past (e.g. after a nav jump) is shown immediately rather than left blank.
    if (!entry.isIntersecting && entry.boundingClientRect.bottom > 0) continue;
    enter(entry.target as HTMLElement);
    revealer.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
revealTargets.forEach(target => revealer.observe(target));
window.addEventListener('scroll', () => {
  $('.header-shell').classList.toggle('is-scrolled', window.scrollY > 8);
  for (const target of revealTargets) if (!target.classList.contains('in-view') && target.getBoundingClientRect().bottom < 0) enter(target);
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

const cleanup = mountAsciiCrown($<HTMLCanvasElement>('#ascii-crown'));
window.addEventListener('pagehide', event => { if (!event.persisted) cleanup(); });
