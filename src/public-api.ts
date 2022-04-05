import { DopplerSessionState } from "./app-session/abstractions";

declare global {
  interface Window {
    dopplerSessionState?: DopplerSessionState;
    "doppler-session-mfe-configuration"?: AppConfiguration;
  }
}

interface AppConfiguration {
  dopplerLegacyBaseUrl: string;
  useDummies: boolean;
  keepAliveMilliseconds: number;
}

export const DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE =
  "doppler-session-state-update";
