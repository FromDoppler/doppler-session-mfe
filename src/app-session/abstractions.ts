export type AuthenticatedDopplerSessionState = {
  status: "authenticated";
  jwtToken: string;
  dopplerAccountName: string;
  unlayerUserId: string;
  unlayerUserSignature: string;
};

export type DopplerSessionState =
  | { status: "unknown" }
  | { status: "non-authenticated" }
  | AuthenticatedDopplerSessionState;

export type DopplerSessionStatus = DopplerSessionState["status"];

export interface DopplerSessionStateMonitor {
  onSessionUpdate: (sessionState: DopplerSessionState) => void;
  start(): void;
}
