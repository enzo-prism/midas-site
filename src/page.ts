// Entry for the static content pages (provider trackers, providers, AI spend, 404). The homepage's
// demo and canvas live in main.ts; these pages only need icons, analytics, and the sticky header.
import './style.css';
import './pages.css';
import {
  createIcons, ArrowUpRight, ArrowDown, ArrowRight, Download, Gauge, Timer, Users, Coins, ShieldCheck, History,
  KeyRound, Terminal, FileText, Globe, Ticket, Layers, Receipt, ChartColumn, CircleSlash, Scale, Cpu, Plus, Pin,
  RefreshCcw, Crown, RotateCw, Settings, Ellipsis, LayoutGrid, Network, Eye, Menu, X, Send,
} from 'lucide';
import { inject } from '@vercel/analytics';
import { initAnalytics, isInternalVisit } from './analytics';
import { initEngagement } from './engagement';
import { initMobile } from './mobile';

initAnalytics();
inject({ beforeSend: event => (isInternalVisit() ? null : event) });
initEngagement();
initMobile();
createIcons({ icons: {
  ArrowUpRight, ArrowDown, ArrowRight, Download, Gauge, Timer, Users, Coins, ShieldCheck, History, KeyRound, Terminal,
  FileText, Globe, Ticket, Layers, Receipt, ChartColumn, CircleSlash, Scale, Cpu, Plus, Pin, RefreshCcw, Crown,
  RotateCw, Settings, Ellipsis, LayoutGrid, Network, Eye, Menu, X, Send,
} });

// The header marks the page you are on.
const here = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
document.querySelectorAll<HTMLAnchorElement>('.header nav a, .footer-links a, .related a').forEach(link => {
  if (link.origin === location.origin && link.pathname.replace(/\.html$/, '') === here) link.setAttribute('aria-current', 'page');
});

const header = document.querySelector<HTMLElement>('.header-shell');
const syncHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();
