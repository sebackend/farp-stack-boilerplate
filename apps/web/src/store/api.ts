import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../store/store";
import { logout, updateAccessToken } from "../features/auth/authSlice";

const apiBaseUrl =
  import.meta.env["VITE_API_URL"] ??
  (typeof window === "undefined"
    ? "http://localhost/api/v1"
    : new URL("/api/v1", window.location.origin).toString());

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const refreshToken = (api.getState() as RootState).auth.refreshToken;

  if (!refreshToken) {
    api.dispatch(logout());
    return result;
  }

  const refreshResult = await rawBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
      body: { refreshToken },
    },
    api,
    extraOptions
  );

  if (refreshResult.data && typeof refreshResult.data === "object") {
    const accessToken = (refreshResult.data as { accessToken?: string }).accessToken;

    if (accessToken) {
      api.dispatch(updateAccessToken(accessToken));
      result = await rawBaseQuery(args, api, extraOptions);
      return result;
    }
  }

  api.dispatch(logout());
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Task", "User"],
  endpoints: () => ({}),
});
