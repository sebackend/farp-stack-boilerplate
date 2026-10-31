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
      useGetTasksQuery: vi.fn(),
      useGetTaskQuery: vi.fn(),
      useCreateTaskMutation: vi.fn(),
      useUpdateTaskMutation: vi.fn(),
      useDeleteTaskMutation: vi.fn(),
    };
  }),
}));

vi.mock("../../store/api", () => ({
  api: {
    injectEndpoints: injectEndpointsMock,
  },
}));

import { tasksApi } from "./tasksApi";

describe("tasksApi", () => {
  it("defines the expected queries, mutations, and tags", () => {
    expect(injectEndpointsMock).toHaveBeenCalledWith(
      expect.objectContaining({ overrideExisting: false })
    );

    void tasksApi;

    const config = injectEndpointsMock.mock.calls[0]?.[0];
    if (!config) {
      throw new Error("injectEndpoints was not called");
    }

    const endpoints = config.endpoints({
      mutation: <T>(definition: T) => definition,
      query: <T>(definition: T) => definition,
    }) as {
      getTasks: {
        query: () => unknown;
        providesTags: (result?: Array<{ id: number }>) => unknown;
      };
      getTask: {
        query: (id: number) => unknown;
        providesTags: (_result: unknown, _err: unknown, id: number) => unknown;
      };
      createTask: {
        query: (body: { title: string }) => unknown;
        invalidatesTags: unknown;
      };
      updateTask: {
        query: (body: { id: number; status: string }) => unknown;
        invalidatesTags: (_result: unknown, _err: unknown, body: { id: number }) => unknown;
      };
      deleteTask: {
        query: (id: number) => unknown;
        invalidatesTags: unknown;
      };
    };

    expect(endpoints.getTasks.query()).toBe("/tasks");
    expect(endpoints.getTasks.providesTags([{ id: 1 }])).toEqual([
      { type: "Task", id: 1 },
      { type: "Task", id: "LIST" },
    ]);
    expect(endpoints.getTasks.providesTags()).toEqual([{ type: "Task", id: "LIST" }]);

    expect(endpoints.getTask.query(1)).toBe("/tasks/1");
    expect(endpoints.getTask.providesTags(undefined, undefined, 1)).toEqual([
      { type: "Task", id: 1 },
    ]);

    expect(endpoints.createTask.query({ title: "New task" })).toEqual({
      url: "/tasks",
      method: "POST",
      body: { title: "New task" },
    });
    expect(endpoints.createTask.invalidatesTags).toEqual([{ type: "Task", id: "LIST" }]);

    expect(endpoints.updateTask.query({ id: 1, status: "DONE" })).toEqual({
      url: "/tasks/1",
      method: "PATCH",
      body: { status: "DONE" },
    });
    expect(endpoints.updateTask.invalidatesTags(undefined, undefined, { id: 1 })).toEqual([
      { type: "Task", id: 1 },
    ]);

    expect(endpoints.deleteTask.query(1)).toEqual({
      url: "/tasks/1",
      method: "DELETE",
    });
    expect(endpoints.deleteTask.invalidatesTags).toEqual([{ type: "Task", id: "LIST" }]);
  });
});
