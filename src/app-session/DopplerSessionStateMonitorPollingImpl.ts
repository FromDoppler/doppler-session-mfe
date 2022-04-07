import {
  DopplerSessionState,
  DopplerSessionStateMonitor,
} from "./abstractions";

export class DopplerSessionStateMonitorPollingImpl
  implements DopplerSessionStateMonitor
{
  private readonly _setInterval: (
    handler: TimerHandler,
    timeout: number
  ) => number;
  private readonly _dopplerLegacyClient;
  private readonly _keepAliveMilliseconds;

  public onSessionUpdate: (sessionState: DopplerSessionState) => void =
    () => {};

  constructor({
    setInterval,
    dopplerLegacyClient,
    keepAliveMilliseconds,
  }: {
    setInterval: (handler: TimerHandler, timeout: number) => number;
    dopplerLegacyClient: any;
    keepAliveMilliseconds: number;
  }) {
    this._setInterval = setInterval;
    this._dopplerLegacyClient = dopplerLegacyClient;
    this._keepAliveMilliseconds = keepAliveMilliseconds;
  }

  private async fetchDopplerUserData(): Promise<DopplerSessionState> {
    const result = await this._dopplerLegacyClient.getDopplerUserData();
    return result.success
      ? {
          status: "authenticated",
          jwtToken: result.value.jwtToken,
          dopplerAccountName: result.value.user.email,
          unlayerUserId: result.value.unlayerUser.id,
          unlayerUserSignature: result.value.unlayerUser.signature,
          lang: result.value.user.lang === "en" ? "en" : "es",
        }
      : { status: "non-authenticated" };
  }

  async start(): Promise<void> {
    this.onSessionUpdate({ status: "unknown" });
    this._setInterval(async () => {
      this.onSessionUpdate(await this.fetchDopplerUserData());
    }, this._keepAliveMilliseconds);
    this.onSessionUpdate(await this.fetchDopplerUserData());
  }
}
