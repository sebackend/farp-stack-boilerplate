import { api } from "../../store/api";
import type { LoginInput, Tokens, UserResponse } from "@repo/shared";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<Tokens, LoginInput>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    me: builder.query<UserResponse, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    refresh: builder.mutation<{ accessToken: string }, { refreshToken: string }>({
      query: (body) => ({
        url: "/auth/refresh",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useRefreshMutation,
} = authApi;
