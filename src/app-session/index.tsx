import {
  DopplerSessionState,
  DopplerSessionStateMonitor,
} from "./abstractions";
import { DopplerSessionStateMonitorPollingImpl } from "./DopplerSessionStateMonitorPollingImpl";
import { DopplerLegacyClient } from "../doppler-legacy-client/abstractions";
import { DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE } from "../public-api";

export const runMonitor = ({
  window,
  dopplerLegacyClient,
  keepAliveMilliseconds,
}: {
  window: Window;
  dopplerLegacyClient: DopplerLegacyClient;
  keepAliveMilliseconds: number;
}): DopplerSessionStateMonitor => {
  const sessionStateMonitor = new DopplerSessionStateMonitorPollingImpl({
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    dopplerLegacyClient,
    keepAliveMilliseconds,
  });

  sessionStateMonitor.onSessionUpdate = (sessionState: DopplerSessionState) => {
    window.dopplerSessionState = sessionState;
    window.dispatchEvent(
      new CustomEvent(DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE, {
        detail: sessionState,
      }),
    );
  };

  sessionStateMonitor.start();

  return sessionStateMonitor;
};
