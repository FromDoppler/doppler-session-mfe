import {
  CollaboratorViewAccessRight,
  DopplerSessionState,
  RawDopplerUserData,
} from "./abstractions";

const COLLABORATOR_PROFILE_TYPE = "COLLABORATOR";
const LOGIN_URL = "https://app.fromdoppler.com/login";

const normalizeSectionId = (idSection?: number | string | null) => {
  const numericSectionId = Number(idSection);
  return Number.isFinite(numericSectionId) ? numericSectionId : undefined;
};

const getUserAccount = (dopplerSessionState: DopplerSessionState) =>
  dopplerSessionState?.status === "authenticated"
    ? (dopplerSessionState.rawDopplerUserData as RawDopplerUserData | undefined)
        ?.userAccount
    : undefined;

const getCollaboratorViewAccessRights = (
  dopplerSessionState: DopplerSessionState,
) => getUserAccount(dopplerSessionState)?.collaboratorViewAccessRights ?? [];

export const isCollaborator = (dopplerSessionState: DopplerSessionState) =>
  getUserAccount(dopplerSessionState)?.userProfileType ===
  COLLABORATOR_PROFILE_TYPE;

export const hasAccessToSection = (
  dopplerSessionState: DopplerSessionState,
  idSection?: number | string | null,
) => {
  const normalizedSectionId = normalizeSectionId(idSection);
  if (!normalizedSectionId || !isCollaborator(dopplerSessionState)) {
    return true;
  }

  return getCollaboratorViewAccessRights(dopplerSessionState).some(
    ({ idSection }) => normalizeSectionId(idSection) === normalizedSectionId,
  );
};

const getFirstAllowedSectionUrl = (
  collaboratorViewAccessRights: CollaboratorViewAccessRight[],
) => {
  const sortedAccessRights = [...collaboratorViewAccessRights].sort((a, b) => {
    const aSectionId =
      normalizeSectionId(a.idSection) ?? Number.MAX_SAFE_INTEGER;
    const bSectionId =
      normalizeSectionId(b.idSection) ?? Number.MAX_SAFE_INTEGER;

    return aSectionId - bSectionId;
  });

  const firstAllowedSectionWithUrl = sortedAccessRights.find(
    (accessRight) => !!accessRight.url,
  );

  return firstAllowedSectionWithUrl?.url ?? undefined;
};

export const getCollaboratorRedirectUrl = (
  dopplerSessionState: DopplerSessionState,
  idSection?: number | string | null,
) => {
  if (
    !isCollaborator(dopplerSessionState) ||
    hasAccessToSection(dopplerSessionState, idSection)
  ) {
    return undefined;
  }

  return (
    getFirstAllowedSectionUrl(
      getCollaboratorViewAccessRights(dopplerSessionState),
    ) ?? LOGIN_URL
  );
};

export const ensureCollaboratorHasAccessOrRedirect = ({
  window,
  idSection,
}: {
  window: Window;
  idSection?: number | string | null;
}) => {
  const redirectUrl = getCollaboratorRedirectUrl(
    window.dopplerSessionState,
    idSection,
  );

  if (redirectUrl) {
    window.location.replace(redirectUrl);
    return false;
  }

  return true;
};
