import { describe, expect, it } from "vitest";
import { store } from "./store";
import { api } from "./api";

describe("store", () => {
  it("configures api and auth reducers", () => {
    const state = store.getState();

    expect(state).toHaveProperty(api.reducerPath);
    expect(state).toHaveProperty("auth");
  });
});
