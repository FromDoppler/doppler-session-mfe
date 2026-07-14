import { DEFAULT_ZENDESK_KEY, runZendesk } from ".";
import { ZendeskWindow } from "./abstractions";

const zendeskKey = "4a6aee15-24bf-4a8b-964f-11eaaf7e5856";

const createWindowDouble = () => {
  const appendedScripts: HTMLScriptElement[] = [];
  let existingSnippet: HTMLElement | null = null;
  const zE = jest.fn();

  const window = {
    zE: undefined as ZendeskWindow["zE"],
    document: {
      getElementById: jest.fn((id: string) =>
        id === "ze-snippet" ? existingSnippet : null,
      ),
      createElement: jest.fn(() => ({}) as HTMLScriptElement),
      body: {
        appendChild: jest.fn((script: HTMLScriptElement) => {
          appendedScripts.push(script);
          return script;
        }),
      },
    },
  } as unknown as ZendeskWindow;

  return {
    window,
    appendedScripts,
    zE,
    simulateZendeskLoaded: () => {
      window.zE = zE;
    },
    simulateSnippetAlreadyPresent: () => {
      existingSnippet = {} as HTMLElement;
    },
  };
};

describe(runZendesk.name, () => {
  it("should load the snippet with the configured key and publish the API", () => {
    // Arrange
    const { window, appendedScripts } = createWindowDouble();

    // Act
    const dopplerZendesk = runZendesk({ window, zendeskKey });

    // Assert
    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0].id).toBe("ze-snippet");
    expect(appendedScripts[0].src).toBe(
      `https://static.zdassets.com/ekr/snippet.js?key=${zendeskKey}`,
    );
    expect(appendedScripts[0].async).toBe(true);
    // `window.dopplerZendesk` must expose only the public API: `loginUser`/
    // `logoutUser` are internal and must never leak to the host apps.
    expect(window.dopplerZendesk).toEqual({
      isOnline: expect.any(Function),
      open: expect.any(Function),
      setLocale: expect.any(Function),
    });
    expect(dopplerZendesk).toMatchObject({
      isOnline: expect.any(Function),
      open: expect.any(Function),
      setLocale: expect.any(Function),
      loginUser: expect.any(Function),
      logoutUser: expect.any(Function),
    });
  });

  it("should fall back to the baked-in default key when none is provided", () => {
    // Arrange
    const { window, appendedScripts } = createWindowDouble();

    // Act
    runZendesk({ window });

    // Assert
    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0].src).toBe(
      `https://static.zdassets.com/ekr/snippet.js?key=${DEFAULT_ZENDESK_KEY}`,
    );
  });

  it("should fall back to the default key when the host injects an empty key", () => {
    // Arrange
    const { window, appendedScripts } = createWindowDouble();

    // Act
    runZendesk({ window, zendeskKey: "" });

    // Assert
    expect(appendedScripts).toHaveLength(1);
    expect(appendedScripts[0].src).toBe(
      `https://static.zdassets.com/ekr/snippet.js?key=${DEFAULT_ZENDESK_KEY}`,
    );
    expect(window.dopplerZendesk).toBeDefined();
  });

  it("should not duplicate the snippet when ze-snippet already exists", () => {
    // Arrange
    const { window, appendedScripts, simulateSnippetAlreadyPresent } =
      createWindowDouble();
    simulateSnippetAlreadyPresent();

    // Act
    runZendesk({ window, zendeskKey });

    // Assert
    expect(appendedScripts).toHaveLength(0);
  });

  it("should not break when invoked before the Zendesk script is loaded", () => {
    // Arrange
    const { window } = createWindowDouble();

    // Act
    const dopplerZendesk = runZendesk({ window, zendeskKey });

    // Assert
    expect(() => dopplerZendesk.open()).not.toThrow();
    expect(() => dopplerZendesk.setLocale("en")).not.toThrow();
  });

  it("should set the initial locale defaulting to 'es' once Zendesk is loaded", () => {
    // Arrange
    const { window, zE, simulateZendeskLoaded } = createWindowDouble();
    simulateZendeskLoaded();

    // Act
    runZendesk({ window, zendeskKey });

    // Assert
    expect(zE).toHaveBeenCalledWith("messenger:set", "locale", "es");
  });

  it("should use the provided initial locale", () => {
    // Arrange
    const { window, zE, simulateZendeskLoaded } = createWindowDouble();
    simulateZendeskLoaded();

    // Act
    runZendesk({ window, zendeskKey, initialLocale: "en" });

    // Assert
    expect(zE).toHaveBeenCalledWith("messenger:set", "locale", "en");
  });

  it("should open the messenger and report online status by UTC hour", () => {
    // Arrange
    const { window, zE, simulateZendeskLoaded } = createWindowDouble();
    simulateZendeskLoaded();
    const dopplerZendesk = runZendesk({ window, zendeskKey });

    // Act
    dopplerZendesk.open();

    // Assert
    expect(zE).toHaveBeenCalledWith("messenger", "open");

    // Online window is 11..23 UTC.
    jest.useFakeTimers().setSystemTime(new Date("2026-06-25T15:00:00Z"));
    expect(dopplerZendesk.isOnline()).toBe(true);
    jest.setSystemTime(new Date("2026-06-25T23:00:00Z"));
    expect(dopplerZendesk.isOnline()).toBe(false);
    jest.setSystemTime(new Date("2026-06-25T10:00:00Z"));
    expect(dopplerZendesk.isOnline()).toBe(false);
    jest.useRealTimers();
  });

  it("should log in the Zendesk user with a freshly fetched JWT", async () => {
    // Arrange
    const { window, zE, simulateZendeskLoaded } = createWindowDouble();
    simulateZendeskLoaded();
    const dopplerZendesk = runZendesk({ window, zendeskKey });
    const getZendeskJwt = jest.fn(async () => "fresh-jwt");

    // Act
    dopplerZendesk.loginUser(getZendeskJwt);
    const [, , jwtCallback] = zE.mock.calls.find(
      ([, action]) => action === "loginUser",
    )!;
    const callback = jest.fn();
    await jwtCallback(callback);

    // Assert
    expect(zE).toHaveBeenCalledWith(
      "messenger",
      "loginUser",
      expect.any(Function),
      expect.any(Function),
    );
    expect(getZendeskJwt).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith("fresh-jwt");
  });

  it("should not invoke Zendesk's callback when the JWT cannot be fetched", async () => {
    // Arrange
    const { window, zE, simulateZendeskLoaded } = createWindowDouble();
    simulateZendeskLoaded();
    const dopplerZendesk = runZendesk({ window, zendeskKey });
    const getZendeskJwt = jest.fn(async () => undefined);

    // Act
    dopplerZendesk.loginUser(getZendeskJwt);
    const [, , jwtCallback] = zE.mock.calls.find(
      ([, action]) => action === "loginUser",
    )!;
    const callback = jest.fn();
    await jwtCallback(callback);

    // Assert
    expect(callback).not.toHaveBeenCalled();
  });

  it("should log out the Zendesk user", () => {
    // Arrange
    const { window, zE, simulateZendeskLoaded } = createWindowDouble();
    simulateZendeskLoaded();
    const dopplerZendesk = runZendesk({ window, zendeskKey });

    // Act
    dopplerZendesk.logoutUser();

    // Assert
    expect(zE).toHaveBeenCalledWith("messenger", "logoutUser");
  });

  it("should not break loginUser/logoutUser when invoked before Zendesk is loaded", () => {
    // Arrange
    const { window } = createWindowDouble();
    const dopplerZendesk = runZendesk({ window, zendeskKey });

    // Act & Assert
    expect(() => dopplerZendesk.loginUser(async () => "jwt")).not.toThrow();
    expect(() => dopplerZendesk.logoutUser()).not.toThrow();
  });
});
