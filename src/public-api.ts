import { DopplerSessionState } from "./app-session/abstractions";
import { DopplerZendesk } from "./zendesk/abstractions";

declare global {
  interface Window {
    dopplerSessionState: DopplerSessionState;
    "doppler-session-mfe-configuration"?: AppConfiguration;
    restartDopplerSessionMonitor: () => void;
    ensureCollaboratorHasAccessOrRedirect: (
      idSection?: number | string | null,
    ) => boolean;
    dopplerZendesk?: DopplerZendesk;
    zE?: (...args: unknown[]) => void;
  }
}

interface AppConfiguration {
  dopplerLegacyBaseUrl: string;
  useDummies: boolean;
  keepAliveMilliseconds: number;
  zendeskKey?: string;
}

export const DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE =
  "doppler-session-state-update";
