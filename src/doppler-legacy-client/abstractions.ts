import { Result } from "../common/abstractions";

type DopplerLegacyUserData = {
  jwtToken: string;
  user: {
    email: string;
    lang: string;
    [prop: string]: any;
  };
  unlayerUser: {
    id: string;
    signature: string;
    [prop: string]: any;
  };
  [prop: string]: any;
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
