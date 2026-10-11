import { TodoInput, ValidatedTodoInput } from "./task-constants";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";

const statuses = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH"] as const;


export function validateListId(listId: unknown): asserts listId is string {
  if (typeof listId !== "string" || !listId.trim()) {
    throw new Error("A valid listId is required.");
  }
}

export async function validateUserSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }
  return session;
}

export function validateTodoInput(body: TodoInput, mode: "create" | "update" = "update"): ValidatedTodoInput {
  if (typeof body.title !== "string" || !body.title.trim()) {
    throw new Error("A title is required.");
  }

  if (body.description !== null && body.description !== undefined && typeof body.description !== "string") {
    throw new Error("Description must be text or null.");
  }

  if (!statuses.includes(body.status as typeof statuses[number])) {
    throw new Error("Invalid task status.");
  }

  if (!priorities.includes(body.priority as typeof priorities[number])) {
    throw new Error("Invalid task priority.");
  }
  
  if (mode === "create" && body.updatedAt !== undefined) {
    throw new Error("UpdatedAt should not be provided when creating a task.");
  }

  const assignedToId =
    body.assignedToId === "" || body.assignedToId === undefined ? null : body.assignedToId;

  if (assignedToId !== null && typeof assignedToId !== "string") {
    throw new Error("Assignee must be a household member or null.");
  }

  return {
    title: body.title.trim(),
    description: body.description === null ? null : body.description ?? null,
    status: body.status as typeof statuses[number],
    priority: body.priority as typeof priorities[number],
    assignedToId,
  };
}
