import axios from "axios";
import { runMonitor } from "./app-session";
import { DopplerLegacyClientDummyImpl } from "./doppler-legacy-client/DopplerLegacyClientDummyImpl";
import { DopplerLegacyClientImpl } from "./doppler-legacy-client/DopplerLegacyClientImpl";

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

runMonitor({ window, dopplerLegacyClient, keepAliveMilliseconds });
