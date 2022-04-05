import axios from "axios";
import { DopplerSessionState } from "./app-session/abstractions";
import { DopplerSessionStateMonitorPollingImpl } from "./app-session/DopplerSessionStateMonitorPollingImpl";
import { DopplerLegacyClientDummyImpl } from "./doppler-legacy-client/DopplerLegacyClientDummyImpl";
import { DopplerLegacyClientImpl } from "./doppler-legacy-client/DopplerLegacyClientImpl";
import { DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE } from "./public-api";

const configuration = window["doppler-session-mfe-configuration"];
const {
  dopplerLegacyBaseUrl = "https://app2.fromdoppler.com",
  useDummies = true,
  keepAliveMilliseconds = 300000,
} = configuration ?? {};

const dopplerLegacyClient = useDummies
  ? new DopplerLegacyClientDummyImpl()
  : new DopplerLegacyClientImpl({
      axiosStatic: axios,
      dopplerLegacyBaseUrl,
    });

const sessionStateMonitor = new DopplerSessionStateMonitorPollingImpl({
  setInterval: window.setInterval.bind(window),
  dopplerLegacyClient,
  keepAliveMilliseconds,
});

sessionStateMonitor.onSessionUpdate = (sessionState: DopplerSessionState) => {
  window.dopplerSessionState = sessionState;
  window.dispatchEvent(
    new CustomEvent(DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE, {
      detail: sessionState,
    })
  );
};

sessionStateMonitor.start();
