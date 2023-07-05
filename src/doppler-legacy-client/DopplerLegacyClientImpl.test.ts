import { DopplerLegacyClientImpl } from "./DopplerLegacyClientImpl";
import { AxiosStatic } from "axios";

const createOkResponse = (data: any) => ({
  data: {
    ...data,
  },
  status: 200,
  statusText: "OK",
});

const createBadRequestError = (data: any = {}) => {
  const error = new Error() as any;
  error.code = "BAD REQUEST";
  error.response = {
    data: {
      ...data,
    },
    status: 400,
    statusText: "BAD REQUEST",
  };
  return error;
};

const createSut = ({
  axiosInstance,
  window = globalThis,
}: {
  axiosInstance: any;
  window?: any;
}) =>
  new DopplerLegacyClientImpl({
    axiosStatic: { create: () => axiosInstance } as unknown as AxiosStatic,
    dopplerLegacyBaseUrl: "baseurl.fromdoppler.net",
    window,
  });

describe(DopplerLegacyClientImpl.name, () => {
  it("should return the legacy user data when response is successful", async () => {
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
    const axiosInstance = {
      get: jest.fn(async () => createOkResponse(demoDopplerUserData)),
    };

    const sut = createSut({ axiosInstance });

    // Act
    const result = await sut.getDopplerUserData();

    // Assert
    expect(result).toEqual({
      success: true,
      value: { ...demoDopplerUserData },
    });
  });

  it("should return an error object when response is not successful", async () => {
    // Arrange
    const axiosInstance = {
      get: jest.fn(async () => {
        throw createBadRequestError();
      }),
    };

    const sut = createSut({ axiosInstance });

    // Act
    const result = await sut.getDopplerUserData();

    // Assert
    expect(result).toEqual({
      success: false,
      error: {
        innerError: expect.anything(),
        userDataNotAvailable: true,
      },
    });
  });

  it("should return when response is successful but data is wrong", async () => {
    // Arrange
    const emptyData = {};
    const axiosInstance = {
      get: jest.fn(async () => createOkResponse(emptyData)),
    };

    const sut = createSut({ axiosInstance });

    // Act
    const result = await sut.getDopplerUserData();

    // Assert
    expect(result).toEqual({
      success: false,
      error: {
        innerError: expect.anything(),
        userDataNotAvailable: true,
      },
    });
  });

  it("should GET the right URL", async () => {
    // Arrange
    const host = "app.fromdoppler.net";
    const emptyData = {};
    const axiosInstance = {
      get: jest.fn(async () => createOkResponse(emptyData)),
    };

    const sut = createSut({ axiosInstance, window: { location: { host } } });

    // Act
    const result = await sut.getDopplerUserData();

    // Assert
    expect(axiosInstance.get).toBeCalledWith(
      "/WebApp/GetUserData?from=app.fromdoppler.net",
    );
  });
});
