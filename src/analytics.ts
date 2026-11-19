// Public measurement ID. GA4 is loaded only on the canonical site after opt-in.
const measurementId = 'G-0WWYML8MTL';
const preferenceKey = 'midas-analytics-consent-v1';
const preferenceLifetime = 180 * 24 * 60 * 60 * 1000;
// Set by visiting `?internal=1` (cleared by `?internal=0`): marks this browser as the team's own.
const internalKey = 'midas-internal-v1';

type AnalyticsWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean;
};

const browser = window as unknown as AnalyticsWindow;
let tagReady = false;
let internal = false;
const readyListeners: (() => void)[] = [];

/** Reads and strips the `internal` query flag before any analytics script sees the URL. */
function readInternalFlag() {
  const url = new URL(location.href);
  const flag = url.searchParams.get('internal');
  try {
    if (flag === '1') localStorage.setItem(internalKey, '1');
    else if (flag === '0') localStorage.removeItem(internalKey);
    internal = localStorage.getItem(internalKey) === '1';
  } catch {
    // Storage can be disabled; the flag then lasts for this visit only.
    internal = flag === '1';
  }
  if (flag === null) return;
  url.searchParams.delete('internal');
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

/** True for the team's own browsers. GA4 tags their traffic as internal; Vercel events are dropped. */
export const isInternalVisit = () => internal;

/**
 * Sends a GA4 event only when the visitor has opted in on the canonical site. Before consent, or on
 * localhost and previews, it does nothing and returns false. Never pass personal data in params.
 */
export function trackEvent(name: string, params: Record<string, string>): boolean {
  if (!tagReady) return false;
  browser.gtag!('event', name, params);
  return true;
}

/** Runs once GA4 is enabled (immediately when it already is), so callers can resend views. */
export function onAnalyticsReady(listener: () => void) {
  if (tagReady) listener();
  else readyListeners.push(listener);
}

export function initAnalytics() {
  readInternalFlag();
  const banner = document.querySelector<HTMLElement>('#analytics-choice')!;
  const preferences = document.querySelector<HTMLButtonElement>('#analytics-preferences')!;
  const allow = document.querySelector<HTMLButtonElement>('#analytics-allow')!;
  const reject = document.querySelector<HTMLButtonElement>('#analytics-reject')!;
  let loaded = false;
  const production = location.hostname === 'midas-ai.dev';

  function savedChoice(): boolean | undefined {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
      if (saved && typeof saved.allowed === 'boolean' && typeof saved.time === 'number' && saved.time <= Date.now() && Date.now() - saved.time < preferenceLifetime) return saved.allowed;
    } catch { /* Storage can be disabled; keep the choice in memory for this visit. */ }
  }

  function enable() {
    if (loaded || !production) return;
    loaded = true;
    browser[`ga-disable-${measurementId}`] = false;
    browser.dataLayer = browser.dataLayer || [];
    browser.gtag = function () { browser.dataLayer!.push(arguments); };
    browser.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    });
    browser.gtag('consent', 'update', { analytics_storage: 'granted' });
    browser.gtag('js', new Date());
    // Keep campaign parameters for attribution; stream-level redaction strips sensitive keys/emails.
    browser.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 15552000,
      cookie_update: false,
      // GA4's internal-traffic data filter matches this value on every event from this config.
      ...(internal ? { traffic_type: 'internal' } : {}),
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
    tagReady = true;
    readyListeners.splice(0).forEach(listener => listener());
  }

  function choose(allowed: boolean) {
    try { localStorage.setItem(preferenceKey, JSON.stringify({ allowed, time: Date.now() })); } catch { /* Optional storage. */ }
    banner.hidden = true;
    if (allowed) enable();
    else {
      tagReady = false;
      browser[`ga-disable-${measurementId}`] = true;
      // Remove this site's GA cookies, including domain cookies, when consent is withdrawn.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (name === '_ga' || name.startsWith('_ga_')) {
          for (const domain of ['', `;domain=${location.hostname}`, `;domain=.${location.hostname}`]) {
            document.cookie = `${name}=;Max-Age=0;path=/${domain};SameSite=Lax`;
          }
        }
      }
      // Unload the Google tag entirely; basic consent mode sends nothing after refusal.
      if (loaded) { location.reload(); return; }
    }
    preferences.focus({ preventScroll: true });
  }

  preferences.addEventListener('click', () => { banner.hidden = false; allow.focus({ preventScroll: true }); });
  allow.addEventListener('click', () => choose(true));
  reject.addEventListener('click', () => choose(false));
  window.addEventListener('storage', event => {
    if (event.key === preferenceKey) location.reload();
  });
  const choice = savedChoice();
  if (choice === true) enable();
  banner.hidden = choice !== undefined;
}
