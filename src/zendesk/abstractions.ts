export type ZendeskLocale = "es" | "en";

export interface DopplerZendesk {
  isOnline: () => boolean;
  open: () => void;
  setLocale: (locale?: string) => void;
}

// Superset of `DopplerZendesk`, returned by `runZendesk` for internal use by
// this MFE only. `loginUser`/`logoutUser` are not published on
// `window.dopplerZendesk`: hosts never call them, the session monitor does.
export interface DopplerZendeskController extends DopplerZendesk {
  loginUser: (getZendeskJwt: () => Promise<string | undefined>) => void;
  logoutUser: () => void;
}

export interface ZendeskWindow {
  document: Document;
  zE?: (...args: unknown[]) => void;
  dopplerZendesk?: DopplerZendesk;
}
