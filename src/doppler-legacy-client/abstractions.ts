import { Result } from "../common/abstractions";

type DopplerLegacyUserData = {
  jwtToken: string;
  user: {
    email: string;
    lang: string;
  };
  unlayerUser: {
    id: string;
    signature: string;
  };
};

type DopplerUserDataNotAvailableError = {
  userDataNotAvailable: true;
  innerError: unknown;
};

export type GetDopplerUserDataResult = Result<
  DopplerLegacyUserData,
  DopplerUserDataNotAvailableError
>;

export interface DopplerLegacyClient {
  getDopplerUserData: () => Promise<GetDopplerUserDataResult>;
}
