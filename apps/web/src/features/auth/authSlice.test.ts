import { describe, it, expect, beforeEach } from "vitest";
import {
  authReducer,
  logout,
  setCredentials,
  type AuthState,
} from "./authSlice";

const baseState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

describe("authSlice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores credentials and persists tokens", () => {
    const state = authReducer(
      baseState,
      setCredentials({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: {
          id: 1,
          email: "admin@example.com",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      })
    );

    expect(state).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      isAuthenticated: true,
      user: {
        id: 1,
      },
    });
    expect(localStorage.getItem("accessToken")).toBe("access-token");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
  });

  it("logout clears state and storage", () => {
    localStorage.setItem("accessToken", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");

    const state = authReducer(
      {
        user: {
          id: 1,
          email: "admin@example.com",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
        isAuthenticated: true,
      },
      logout()
    );

    expect(state).toEqual(baseState);
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
  });
});
