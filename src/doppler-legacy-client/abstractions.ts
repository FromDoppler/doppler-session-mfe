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

type ZendeskJwtNotAvailableError = {
  zendeskJwtNotAvailable: true;
  innerError: unknown;
};

export type GetZendeskJwtResult = Result<
  { zendeskJwt: string },
  ZendeskJwtNotAvailableError
>;

export interface DopplerLegacyClient {
  getDopplerUserData: () => Promise<GetDopplerUserDataResult>;
  getZendeskJwt: () => Promise<GetZendeskJwtResult>;
}
