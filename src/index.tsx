import axios from "axios";
import { runMonitor } from "./app-session";
import { DopplerLegacyClientDummyImpl } from "./doppler-legacy-client/DopplerLegacyClientDummyImpl";
import { DopplerLegacyClientImpl } from "./doppler-legacy-client/DopplerLegacyClientImpl";
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
runZendesk({ window, zendeskKey });

const dopplerLegacyClient = useDummies
  ? new DopplerLegacyClientDummyImpl()
  : new DopplerLegacyClientImpl({
      axiosStatic: axios,
      dopplerLegacyBaseUrl,
      window,
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
