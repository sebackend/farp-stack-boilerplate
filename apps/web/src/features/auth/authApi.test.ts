import { describe, expect, it, vi } from "vitest";

const { injectEndpointsMock } = vi.hoisted(() => ({
  injectEndpointsMock: vi.fn((config: {
    endpoints: (builder: {
      mutation: <T>(definition: T) => T;
      query: <T>(definition: T) => T;
    }) => Record<string, unknown>;
    overrideExisting: boolean;
  }) => {
    const endpoints = config.endpoints({
      mutation: (definition) => definition,
      query: (definition) => definition,
    });

    return {
      endpoints,
      useLoginMutation: vi.fn(),
      useLogoutMutation: vi.fn(),
      useMeQuery: vi.fn(),
      useLazyMeQuery: vi.fn(),
      useRefreshMutation: vi.fn(),
    };
  }),
}));

vi.mock("../../store/api", () => ({
  api: {
    injectEndpoints: injectEndpointsMock,
  },
}));

import { authApi } from "./authApi";

describe("authApi", () => {
  it("defines the expected auth endpoints", () => {
    expect(injectEndpointsMock).toHaveBeenCalledWith(
      expect.objectContaining({ overrideExisting: false })
    );

    void authApi;

    const config = injectEndpointsMock.mock.calls[0]?.[0];
    if (!config) {
      throw new Error("injectEndpoints was not called");
    }

    const endpoints = config.endpoints({
      mutation: <T>(definition: T) => definition,
      query: <T>(definition: T) => definition,
    }) as {
      login: { query: (body: { email: string; password: string }) => unknown };
      logout: { query: () => unknown };
      me: { query: () => unknown; providesTags: unknown };
      refresh: { query: (body: { refreshToken: string }) => unknown };
    };

    expect(endpoints.login.query({ email: "admin@example.com", password: "secret" })).toEqual({
      url: "/auth/login",
      method: "POST",
      body: { email: "admin@example.com", password: "secret" },
    });
    expect(endpoints.logout.query()).toEqual({ url: "/auth/logout", method: "POST" });
    expect(endpoints.me.query()).toBe("/auth/me");
    expect(endpoints.me.providesTags).toEqual(["User"]);
    expect(endpoints.refresh.query({ refreshToken: "token" })).toEqual({
      url: "/auth/refresh",
      method: "POST",
      body: { refreshToken: "token" },
    });
  });
});
