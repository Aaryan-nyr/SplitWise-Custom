import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

const statuses = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH"] as const;

type RouteContext = { params: Promise<{ id: string }> };

type UpdateTodoBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
};


type NewTodoBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
  createdById?: unknown;
  updatedAt?: unknown;
}

type TodoInput = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
  createdById?: unknown;
  updatedAt?: unknown;
};


type ValidatedTodoInput = {
  title: string;
  description: string | null;
  status: typeof statuses[number];
  priority: typeof priorities[number];
  assignedToId: string | null;
}

function validateTodoInput(body: TodoInput, mode: "create" | "update" = "update"): ValidatedTodoInput {
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
  
  if (mode === "create" && typeof body.createdById !== "string") {
    throw new Error("CreatedById is required for creating a task.");
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

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json() as NewTodoBody;
  var validatedInput = <ValidatedTodoInput>{};
  try {
    validatedInput = validateTodoInput(body, "create");
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  // find the household list

  const householdDefaultList = await prisma.todoList.findFirst({
    where: { id },
  });

  const newToDo = await prisma.todoItem.create({
    data: {
      title: validatedInput.title,
      assignedToId: validatedInput.assignedToId,
      description: validatedInput.description,
      status: validatedInput.status,
      priority: validatedInput.priority,
      listId: id,
      createdById: body.createdById as string,
    },
    include: {
      assignedTo: true,
      createdBy: true,
      lastEditedBy: true,
      comments: { orderBy: { createdAt: "asc" }, include: { createdBy: true } },
    },
  });

  return NextResponse.json({
    id: newToDo.id,
    title: newToDo.title,
    description: newToDo.description,
    status: newToDo.status,
    priority: newToDo.priority,
    assignedToId: newToDo.assignedToId,
    assignee: newToDo.assignedTo?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "UN",
    createdBy: newToDo.createdBy.name ?? newToDo.createdBy.email,
    assignedTo: newToDo.assignedTo?.name ?? newToDo.assignedTo?.email ?? "Unassigned",
    lastEditedBy: newToDo.lastEditedBy?.name ?? newToDo.lastEditedBy?.email ?? "Not edited",
    updatedAt: newToDo.updatedAt,
    comments: newToDo.comments.map((comment) => ({
      id: comment.id,
      authorId: comment.createdById,
      author: comment.createdBy.name ?? comment.createdBy.email,
      updatedAt: comment.updatedAt,
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  });
}


export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json() as UpdateTodoBody;
  var validatedInput = <ValidatedTodoInput>{};
  try {
    validatedInput = validateTodoInput(body, "update");
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const updatedTodo = await prisma.todoItem.update({
    where: { id },
    data: {
      title: validatedInput.title,
      assignedToId: validatedInput.assignedToId,
      description: validatedInput.description,
      status: validatedInput.status,
      priority: validatedInput.priority,
    },
    include: {
      assignedTo: true,
      createdBy: true,
      lastEditedBy: true,
      comments: { orderBy: { createdAt: "asc" }, include: { createdBy: true } },
    },
  });

  return NextResponse.json({
    id: updatedTodo.id,
    title: updatedTodo.title,
    description: updatedTodo.description,
    status: updatedTodo.status,
    priority: updatedTodo.priority,
    assignedToId: updatedTodo.assignedToId,
    assignee: updatedTodo.assignedTo?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "UN",
    createdBy: updatedTodo.createdBy.name ?? updatedTodo.createdBy.email,
    assignedTo: updatedTodo.assignedTo?.name ?? updatedTodo.assignedTo?.email ?? "Unassigned",
    lastEditedBy: updatedTodo.lastEditedBy?.name ?? updatedTodo.lastEditedBy?.email ?? "Not edited",
    updatedAt: updatedTodo.updatedAt,
    comments: updatedTodo.comments.map((comment) => ({
      id: comment.id,
      authorId: comment.createdById,
      author: comment.createdBy.name ?? comment.createdBy.email,
      updatedAt: comment.updatedAt,
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  });
}
