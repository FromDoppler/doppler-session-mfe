import { DopplerLegacyClient, GetDopplerUserDataResult } from "./abstractions";
import { AxiosInstance, AxiosStatic } from "axios";

export class DopplerLegacyClientImpl implements DopplerLegacyClient {
  private axios: AxiosInstance;
  private host: string;

  constructor({
    axiosStatic,
    dopplerLegacyBaseUrl,
    window: {
      location: { host },
    },
  }: {
    axiosStatic: AxiosStatic;
    dopplerLegacyBaseUrl: string;
    window: Window;
  }) {
    this.host = host;
    this.axios = axiosStatic.create({
      baseURL: dopplerLegacyBaseUrl,
      withCredentials: true,
    });
  }

  async getDopplerUserData(): Promise<GetDopplerUserDataResult> {
    try {
      // Including host in the URL to avoid aggresive cache that
      // ignores the origin and breaks CORS behavior
      const axiosResponse = await this.axios.get(
        `/WebApp/GetUserData?from=${this.host}`
      );
      const {
        jwtToken,
        user: { email: userEmail, lang: userLang, ...userRest },
        unlayerUser: {
          id: unlayerUserId,
          signature: unlayerUserSignature,
          ...unlayerUserRest
        },
        ...rest
      } = axiosResponse.data;
      return {
        success: true,
        value: {
          ...rest,
          jwtToken,
          user: {
            ...userRest,
            email: userEmail,
            lang: userLang,
          },
          unlayerUser: {
            ...unlayerUserRest,
            id: unlayerUserId,
            signature: unlayerUserSignature,
          },
        },
      };
    } catch (error) {
      console.error("Error loading GetUserData", error);
      return {
        success: false,
        error: {
          userDataNotAvailable: true,
          innerError: error,
        },
      };
    }
  }
}
