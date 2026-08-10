export type CollaboratorViewAccessRight = {
  idSection?: number | string;
  url?: string | null;
  [prop: string]: unknown;
};

export type RawUserAccount = {
  userProfileType?: string;
  collaboratorViewAccessRights?: CollaboratorViewAccessRight[];
  [prop: string]: unknown;
};

export type RawDopplerUserData = {
  userAccount?: RawUserAccount;
  [prop: string]: unknown;
};

export type AuthenticatedDopplerSessionState = {
  status: "authenticated";
  jwtToken: string;
  dopplerAccountName: string;
  unlayerUserId: string;
  unlayerUserSignature: string;
  lang: "en" | "es";
  rawDopplerUserData: RawDopplerUserData;
};

export type DopplerSessionState =
  | undefined
  | { status: "non-authenticated" }
  | AuthenticatedDopplerSessionState;

export interface DopplerSessionStateMonitor {
  onSessionUpdate: (sessionState: DopplerSessionState) => void;
  start(): void;
  stopAndDispose(): void;
}
