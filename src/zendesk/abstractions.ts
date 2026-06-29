export type ZendeskLocale = "es" | "en";

export interface DopplerZendesk {
  isOnline: () => boolean;
  open: () => void;
  setLocale: (locale?: string) => void;
}

export interface ZendeskWindow {
  document: Document;
  zE?: (...args: unknown[]) => void;
  dopplerZendesk?: DopplerZendesk;
}
