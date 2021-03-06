import { runMonitor } from ".";
import { timeout } from "../common/utils";
import {
  DopplerLegacyClient,
  GetDopplerUserDataResult,
} from "../doppler-legacy-client/abstractions";

const createWindowDouble = () => {
  let intervalHandler: Function = () => {};
  let lastDispatchedEventRef = {
    value: null as any,
  };
  return {
    runIntervalEvent: () => intervalHandler(),
    lastDispatchedEventRef,
    window: {
      setInterval: jest.fn((handler: Function) => {
        intervalHandler = handler;
      }),
      dispatchEvent: jest.fn((event) => {
        lastDispatchedEventRef.value = event;
      }),
    } as unknown as Window,
  };
};

const createDopplerLegacyClientDouble = (demoDopplerUserData: any) => {
  let getDopplerUserDataResolve: (result: GetDopplerUserDataResult) => void;
  const runResultResolvingGetDopplerUserData = async (
    result: GetDopplerUserDataResult
  ) => {
    getDopplerUserDataResolve(result);
    await timeout(0);
  };

  const runErrorResolvingGetDopplerUserData = async () =>
    runResultResolvingGetDopplerUserData({
      success: false,
      error: {
        userDataNotAvailable: true,
        innerError: new Error(),
      },
    });

  const runSuccessResolvingGetDopplerUserData = async () =>
    runResultResolvingGetDopplerUserData({
      success: true,
      value: {
        ...demoDopplerUserData,
      },
    });

  return {
    dopplerLegacyClient: {
      getDopplerUserData: jest.fn(
        () =>
          new Promise((resolve) => {
            getDopplerUserDataResolve = resolve;
          })
      ),
    } as DopplerLegacyClient,
    runErrorResolvingGetDopplerUserData,
    runSuccessResolvingGetDopplerUserData,
  };
};

describe(runMonitor.name, () => {
  it("should work recurrently as expected 😛", async () => {
    // Arrange
    const demoDopplerUserData = {
      jwtToken: "session_token",
      user: {
        email: "user@email",
        fullname: "user.fullname",
        lang: "es",
        avatar: {
          text: "NN",
          color: "#99CFB8",
        },
        undocumentedProp1: "undocumentedProp1",
      },
      unlayerUser: {
        id: "user_id",
        signature: "user_signature",
        undocumentedProp2: "undocumentedProp2",
      },
      undocumentedProp3: "undocumentedProp3",
    };

    const keepAliveMilliseconds = 600000;
    const { window, lastDispatchedEventRef, runIntervalEvent } =
      createWindowDouble();
    const {
      dopplerLegacyClient,
      runErrorResolvingGetDopplerUserData,
      runSuccessResolvingGetDopplerUserData,
    } = createDopplerLegacyClientDouble(demoDopplerUserData);

    // Act
    // Initialization
    runMonitor({
      window,
      dopplerLegacyClient,
      keepAliveMilliseconds,
    });

    // Assert
    // After initialization, the status should be `unknown` while we look forward
    // to the server response for getDopplerUserData.
    expect(dopplerLegacyClient.getDopplerUserData).toHaveBeenCalledTimes(1);
    expect(window.dopplerSessionState).toEqual({
      status: "unknown",
    });
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(lastDispatchedEventRef.value).toBeInstanceOf(CustomEvent);
    expect(lastDispatchedEventRef.value.type).toBe(
      "doppler-session-state-update"
    );

    // Act
    // Server responds successfully for getDopplerUserData
    await runSuccessResolvingGetDopplerUserData();

    // Assert
    // After a successful response for getDopplerUserData, the status should be
    // `authenticated`.
    expect(window.dopplerSessionState).toEqual({
      status: "authenticated",
      dopplerAccountName: demoDopplerUserData.user.email,
      jwtToken: demoDopplerUserData.jwtToken,
      unlayerUserId: demoDopplerUserData.unlayerUser.id,
      unlayerUserSignature: demoDopplerUserData.unlayerUser.signature,
      lang: demoDopplerUserData.user.lang,
      rawDopplerUserData: demoDopplerUserData,
    });
    expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
    expect(lastDispatchedEventRef.value).toBeInstanceOf(CustomEvent);
    expect(lastDispatchedEventRef.value.type).toBe(
      "doppler-session-state-update"
    );

    // Act
    // The time has elapsed and the interval is executed
    runIntervalEvent();

    // Assert
    // After interval is executed, the status should be the same as before while
    // we look forward to the server response for getDopplerUserData.
    expect(window.dopplerSessionState).toEqual({
      status: "authenticated",
      dopplerAccountName: demoDopplerUserData.user.email,
      jwtToken: demoDopplerUserData.jwtToken,
      unlayerUserId: demoDopplerUserData.unlayerUser.id,
      unlayerUserSignature: demoDopplerUserData.unlayerUser.signature,
      lang: demoDopplerUserData.user.lang,
      rawDopplerUserData: demoDopplerUserData,
    });
    expect(window.dispatchEvent).toHaveBeenCalledTimes(2);

    // Act
    // Server responds with an error for getDopplerUserData, for example if the
    // user logs off in another tab
    await runErrorResolvingGetDopplerUserData();

    // Assert
    // After an error response for getDopplerUserData, the status should be
    // `non-authenticated`.
    expect(window.dopplerSessionState).toEqual({
      status: "non-authenticated",
    });
    expect(window.dispatchEvent).toHaveBeenCalledTimes(3);
    expect(lastDispatchedEventRef.value).toBeInstanceOf(CustomEvent);
    expect(lastDispatchedEventRef.value.type).toBe(
      "doppler-session-state-update"
    );
  });
});
