import { DopplerLegacyClient } from "../doppler-legacy-client/abstractions";
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
  private readonly _clearInterval: (intervalID: number) => void;
  private readonly _dopplerLegacyClient;
  private readonly _keepAliveMilliseconds;
  private _intervalID: number | undefined;
  private _disposed: boolean = false;

  public onSessionUpdate: (sessionState: DopplerSessionState) => void =
    () => {};

  constructor({
    setInterval,
    clearInterval,
    dopplerLegacyClient,
    keepAliveMilliseconds,
  }: {
    setInterval: (handler: TimerHandler, timeout: number) => number;
    clearInterval: (intervalID: number) => void;
    dopplerLegacyClient: DopplerLegacyClient;
    keepAliveMilliseconds: number;
  }) {
    this._setInterval = setInterval;
    this._clearInterval = clearInterval;
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
          rawDopplerUserData: result.value,
        }
      : { status: "non-authenticated" };
  }

  async start(): Promise<void> {
    this.onSessionUpdate({ status: "unknown" });
    this._intervalID = this._setInterval(async () => {
      const userData = await this.fetchDopplerUserData();
      if (!this._disposed) {
        this.onSessionUpdate(userData);
      }
    }, this._keepAliveMilliseconds);
    const userData = await this.fetchDopplerUserData();
    if (!this._disposed) {
      this.onSessionUpdate(userData);
    }
  }

  stopAndDispose(): void {
    this._disposed = true;
    if (this._intervalID !== undefined) {
      this._clearInterval(this._intervalID);
    }
  }
}
