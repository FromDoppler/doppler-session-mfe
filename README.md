# Doppler Session Micro-Frontend

## Doppler Session Polling

Basic behavior of DopplerSession micro-frontend:

```mermaid
sequenceDiagram
  participant Browser
  participant DopplerSessionMFE
  participant window
  participant DopplerMVC

  Browser->>+DopplerSessionMFE: start
  alt User does not have a session in Doppler
    DopplerSessionMFE->>+DopplerMVC: GetUserData(cookie)
    DopplerMVC-->>-DopplerSessionMFE: Error
    DopplerSessionMFE->>window: WRITE dopplerSessionState = { status: "non-authenticated" }
    DopplerSessionMFE-)window: dispatchEvent("doppler-session-state-update", { status: "non-authenticated" })
  else User has a session in Doppler
    DopplerSessionMFE->>+DopplerMVC: GetUserData(cookie)
    DopplerMVC-->>-DopplerSessionMFE: UserData
    DopplerSessionMFE->>window: WRITE dopplerSessionState = { status: "authenticated", . . . }
    DopplerSessionMFE-)window: dispatchEvent("doppler-session-state-update", { status: "authenticated", . . . })
  end
  deactivate DopplerSessionMFE

  loop Each 5 min
  Browser->>+DopplerSessionMFE: interval
  alt User does not have a session in Doppler
    DopplerSessionMFE->>+DopplerMVC: GetUserData(cookie)
    DopplerMVC-->>-DopplerSessionMFE: Error
    DopplerSessionMFE->>window: WRITE dopplerSessionState = { status: "non-authenticated" }
    DopplerSessionMFE-)window: dispatchEvent("doppler-session-state-update", { status: "non-authenticated" })
  else User has a session in Doppler
    DopplerSessionMFE->>+DopplerMVC: GetUserData(cookie)
    DopplerMVC-->>-DopplerSessionMFE: UserData
    DopplerSessionMFE->>window: WRITE dopplerSessionState = { status: "authenticated", . . . }
    DopplerSessionMFE-)window: dispatchEvent("doppler-session-state-update", { status: "authenticated", . . . })
  end
  deactivate DopplerSessionMFE
  end
```

Opening a private page in a WebApp micro-frontend:

```mermaid
sequenceDiagram
  participant Browser
  participant WebAppMFE
  participant window

  Browser->>+WebAppMFE: start
  WebAppMFE-)window: addEventListener ("doppler-session-state-update", . . .)
  WebAppMFE->>+window: READ dopplerSessionState
  window-->>-WebAppMFE: READ undefined [*]
  WebAppMFE-->>-Browser: Show spinner

  alt User does not have a session in Doppler
    window->>+WebAppMFE: on "doppler-session-state-update"
    WebAppMFE->>+window: READ dopplerSessionState
    window-->>-WebAppMFE: READ { status = "non-authenticated" }
    WebAppMFE-->>-Browser: Redirect to Login
  else User has a session in Doppler
    window->>+WebAppMFE: on "doppler-session-state-update"
    WebAppMFE->>+window: READ dopplerSessionState
    window-->>-WebAppMFE: READ { status = "authenticated", . . . }
    WebAppMFE-->>-Browser: Render the page
  end
```

`[*]` At the moment, the first answers for `READ dopplerSessionState` will always
be `null`. But in the future, _DopplerSession micro-frontend_ is going to be improved
to cache the last session state (for example, in local storage), so the first steps
could be omitted.
