import { configureStore } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { authReducer } from "../features/auth/authSlice";

const testApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProtected: builder.query<{ ok: boolean }, void>({
      query: () => "/protected",
    }),
  }),
  overrideExisting: false,
});

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createTestStore(preloadedAuth?: {
  accessToken?: string | null;
  refreshToken?: string | null;
  isAuthenticated?: boolean;
}) {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    preloadedState: {
      auth: {
        user: null,
        accessToken: preloadedAuth?.accessToken ?? null,
        refreshToken: preloadedAuth?.refreshToken ?? null,
        isAuthenticated: preloadedAuth?.isAuthenticated ?? false,
      },
    },
  });
}

describe("store api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends Authorization when there is an access token", async () => {
    const fetchMock = vi.mocked(fetch);
    const store = createTestStore({ accessToken: "access-token", isAuthenticated: true });

    fetchMock.mockResolvedValueOnce(createJsonResponse({ ok: true }));

    const result = await store.dispatch(testApi.endpoints.getProtected.initiate());

    expect(result).toMatchObject({ data: { ok: true } });
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.headers.get("authorization")).toBe("Bearer access-token");
  });

  it("logs out if it receives 401 and there is no refresh token", async () => {
    const fetchMock = vi.mocked(fetch);
    const store = createTestStore({ accessToken: "expired", isAuthenticated: true });

    fetchMock.mockResolvedValueOnce(createJsonResponse({ error: "unauthorized" }, 401));

    const result = await store.dispatch(testApi.endpoints.getProtected.initiate());

    expect(result).toMatchObject({ error: { status: 401 } });
    expect(store.getState().auth).toMatchObject({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it("refreshes the token and retries the request when refresh succeeds", async () => {
    const fetchMock = vi.mocked(fetch);
    const store = createTestStore({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      isAuthenticated: true,
    });

    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(createJsonResponse({ accessToken: "new-access-token" }))
      .mockResolvedValueOnce(createJsonResponse({ ok: true }));

    const result = await store.dispatch(testApi.endpoints.getProtected.initiate());

    expect(result).toMatchObject({ data: { ok: true } });
    expect(store.getState().auth.accessToken).toBe("new-access-token");
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshRequest = fetchMock.mock.calls[1]?.[0] as Request;
    expect(new URL(refreshRequest.url).pathname).toBe("/api/v1/auth/refresh");
  });

  it("logs out if refresh fails", async () => {
    const fetchMock = vi.mocked(fetch);
    const store = createTestStore({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      isAuthenticated: true,
    });

    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(createJsonResponse({ error: "invalid refresh" }, 401));

    const result = await store.dispatch(testApi.endpoints.getProtected.initiate());

    expect(result).toMatchObject({ error: { status: 401 } });
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
