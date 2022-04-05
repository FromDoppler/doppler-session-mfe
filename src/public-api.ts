declare global {
  interface Window {
    "doppler-session-mfe-configuration"?: AppConfiguration;
  }
}

interface AppConfiguration {
  dopplerLegacyBaseUrl: string;
  useDummies: boolean;
}

export {}
