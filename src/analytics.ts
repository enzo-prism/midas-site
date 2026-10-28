// Public measurement ID. GA4 is loaded only on the canonical site after opt-in.
const measurementId = 'G-0WWYML8MTL';
const preferenceKey = 'midas-analytics-consent-v1';
const preferenceLifetime = 180 * 24 * 60 * 60 * 1000;

type AnalyticsWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean;
};

export function initAnalytics() {
  const browser = window as unknown as AnalyticsWindow;
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
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }

  function choose(allowed: boolean) {
    try { localStorage.setItem(preferenceKey, JSON.stringify({ allowed, time: Date.now() })); } catch { /* Optional storage. */ }
    banner.hidden = true;
    if (allowed) enable();
    else {
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
