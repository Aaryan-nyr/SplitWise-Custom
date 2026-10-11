export const TASK_STATUSES = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type NewTodoBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
  createdById?: unknown;
  updatedAt?: unknown;
}

export type TodoInput = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
  createdById?: unknown;
  updatedAt?: unknown;
};

export type ValidatedTodoInput = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
}

export type UpdateTodoBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
};
