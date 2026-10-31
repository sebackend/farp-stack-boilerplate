import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { logout } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "./hooks";
import { store } from "./store";

function HooksProbe() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <button onClick={() => dispatch(logout())}>
      {isAuthenticated ? "authenticated" : "anonymous"}
    </button>
  );
}

describe("store hooks", () => {
  it("exposes typed hooks over the store", () => {
    render(
      <Provider store={store}>
        <HooksProbe />
      </Provider>
    );

    expect(screen.getByRole("button")).toHaveTextContent("anonymous");
  });
});
