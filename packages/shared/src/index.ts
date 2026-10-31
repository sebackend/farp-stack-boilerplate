// Contract types generated from the FastAPI OpenAPI schema.
// Source of truth: Pydantic models in apps/api. Regenerate with `pnpm contracts`.
import type { components } from "./generated/api.js";

type Schemas = components["schemas"];

// Auth
export type LoginInput = Schemas["LoginInput"];
export type RefreshInput = Schemas["RefreshInput"];
export type Tokens = Schemas["Tokens"];
export type AccessToken = Schemas["AccessToken"];
export type UserResponse = Schemas["UserResponse"];

// Tasks
export type TaskStatus = Schemas["TaskStatus"];
export type TaskPriority = Schemas["TaskPriority"];
export type CreateTaskInput = Schemas["CreateTaskInput"];
export type UpdateTaskInput = Schemas["UpdateTaskInput"];
export type TaskResponse = Schemas["TaskResponse"];
export type TaskListResponse = TaskResponse[];

// Errors
export interface ApiError {
  error: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

export type { components, paths } from "./generated/api.js";
