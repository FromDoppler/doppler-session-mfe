import { DopplerLegacyClient, GetDopplerUserDataResult } from "./abstractions";
import { AxiosInstance, AxiosStatic } from "axios";

export class DopplerLegacyClientImpl implements DopplerLegacyClient {
  private axios: AxiosInstance;

  constructor({
    axiosStatic,
    dopplerLegacyBaseUrl,
  }: {
    axiosStatic: AxiosStatic;
    dopplerLegacyBaseUrl: string;
  }) {
    this.axios = axiosStatic.create({
      baseURL: dopplerLegacyBaseUrl,
      withCredentials: true,
    });
  }

  async getDopplerUserData(): Promise<GetDopplerUserDataResult> {
    try {
      const axiosResponse = await this.axios.get("/WebApp/GetUserData");
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
