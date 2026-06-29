import { DopplerZendesk, ZendeskWindow } from "./abstractions";

const ZENDESK_SCRIPT_ID = "ze-snippet";
const ZENDESK_SCRIPT_BASE_URL =
  "https://static.zdassets.com/ekr/snippet.js?key=";

// Single key for every user, same value in all environments. It was hardcoded
// in the webapp's index.html before the migration; we bake the same default
// here so the widget loads even if the host does not inject `zendeskKey`.
export const DEFAULT_ZENDESK_KEY = "4a6aee15-24bf-4a8b-964f-11eaaf7e5856";

// Horario de atención: (UTC-03:00) Buenos Aires, 8:00 a 20:00 => 11..23 UTC.
const ONLINE_FROM_UTC_HOUR = 11;
const ONLINE_TO_UTC_HOUR = 23;

const DEFAULT_LOCALE = "es";

const loadZendeskScript = (window: ZendeskWindow, key: string) => {
  const { document } = window;
  // `ze-snippet` is the id Zendesk uses to avoid duplicating the widget.
  if (!key || document.getElementById(ZENDESK_SCRIPT_ID)) {
    return;
  }
  const script = document.createElement("script");
  script.id = ZENDESK_SCRIPT_ID;
  script.src = `${ZENDESK_SCRIPT_BASE_URL}${key}`;
  script.async = true;
  document.body.appendChild(script);
};

const isZendeskChatOnline = () => {
  const hour = new Date().getUTCHours();
  return hour >= ONLINE_FROM_UTC_HOUR && hour < ONLINE_TO_UTC_HOUR;
};

const openZendeskChat = (window: ZendeskWindow) => {
  // Defensive `if (window.zE)`: works even if invoked before the script loads.
  if (window.zE) {
    window.zE("messenger", "open");
  }
};

const setZendeskLocale = (window: ZendeskWindow, locale?: string) => {
  if (window.zE) {
    window.zE("messenger:set", "locale", locale ?? DEFAULT_LOCALE);
  }
};

export const runZendesk = ({
  window,
  zendeskKey,
  initialLocale,
}: {
  window: ZendeskWindow;
  zendeskKey?: string;
  initialLocale?: string;
}): DopplerZendesk => {
  loadZendeskScript(window, zendeskKey || DEFAULT_ZENDESK_KEY);

  const dopplerZendesk: DopplerZendesk = {
    isOnline: () => isZendeskChatOnline(),
    open: () => openZendeskChat(window),
    setLocale: (locale) => setZendeskLocale(window, locale),
  };

  // Publish the API as soon as possible so the webapp can find it.
  window.dopplerZendesk = dopplerZendesk;
  dopplerZendesk.setLocale(initialLocale);

  return dopplerZendesk;
};
