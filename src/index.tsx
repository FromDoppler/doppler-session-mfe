import axios from "axios";
import { runMonitor } from "./app-session";
import { DopplerSessionState } from "./app-session/abstractions";
import { DopplerLegacyClientDummyImpl } from "./doppler-legacy-client/DopplerLegacyClientDummyImpl";
import { DopplerLegacyClientImpl } from "./doppler-legacy-client/DopplerLegacyClientImpl";
import { DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE } from "./public-api";
import { runZendesk } from "./zendesk";

const configuration = window["doppler-session-mfe-configuration"];
const {
  dopplerLegacyBaseUrl = "https://app2.fromdoppler.com",
  useDummies = true,
  keepAliveMilliseconds = 300000,
  zendeskKey,
} = configuration ?? {};

// Publish `window.dopplerZendesk` as early as possible so the webapp finds it.
// `zendeskKey` is optional: the host rarely injects it, so the module falls back
// to its baked-in default key (same value the webapp used to hardcode).
const zendesk = runZendesk({ window, zendeskKey });

const dopplerLegacyClient = useDummies
  ? new DopplerLegacyClientDummyImpl()
  : new DopplerLegacyClientImpl({
      axiosStatic: axios,
      dopplerLegacyBaseUrl,
      window,
    });

window.addEventListener(DOPPLER_SESSION_STATE_UPDATE_EVENT_TYPE, (event) => {
  const sessionState = (event as CustomEvent<DopplerSessionState>).detail;
  if (sessionState?.status === "authenticated") {
    zendesk.loginUser(() =>
      dopplerLegacyClient
        .getZendeskJwt()
        .then((result) =>
          result.success ? result.value.zendeskJwt : undefined,
        ),
    );
  } else if (sessionState?.status === "non-authenticated") {
    zendesk.logoutUser();
  }
});

let monitor = runMonitor({
  window,
  dopplerLegacyClient,
  keepAliveMilliseconds,
});

function restartDopplerSessionMonitor() {
  monitor.stopAndDispose();
  monitor = runMonitor({ window, dopplerLegacyClient, keepAliveMilliseconds });
}

window.restartDopplerSessionMonitor = restartDopplerSessionMonitor;
