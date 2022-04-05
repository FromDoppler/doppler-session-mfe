import axios from "axios";
import { DopplerLegacyClientDummyImpl } from "./doppler-legacy-client/DopplerLegacyClientDummyImpl";
import { DopplerLegacyClientImpl } from "./doppler-legacy-client/DopplerLegacyClientImpl";

const configuration = window["doppler-session-mfe-configuration"];
const {
  dopplerLegacyBaseUrl = "https://app2.fromdoppler.com",
  useDummies = true,
} = configuration ?? {};

const dopplerLegacyClient = useDummies
  ? new DopplerLegacyClientDummyImpl()
  : new DopplerLegacyClientImpl({
      axiosStatic: axios,
      dopplerLegacyBaseUrl,
    });

// TODO: use dopplerLegacyClient to test Doppler Session
console.log({ dopplerLegacyClient });
