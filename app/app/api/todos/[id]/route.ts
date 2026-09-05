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

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json() as UpdateTodoBody;

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  if (body.description !== null && typeof body.description !== "string") {
    return NextResponse.json({ error: "Description must be text or null." }, { status: 400 });
  }

  if (!statuses.includes(body.status as typeof statuses[number])) {
    return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
  }

  if (!priorities.includes(body.priority as typeof priorities[number])) {
    return NextResponse.json({ error: "Invalid task priority." }, { status: 400 });
  }

  const todo = await prisma.todoItem.findUnique({
    where: { id },
    include: {
      list: true,
      assignedTo: true,
      createdBy: true,
      lastEditedBy: true,
      comments: { orderBy: { createdAt: "asc" }, include: { createdBy: true } },
    },
  });

  if (!todo) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const assignedToId = body.assignedToId === "" || body.assignedToId === undefined ? null : body.assignedToId;

  if (assignedToId !== null && typeof assignedToId !== "string") {
    return NextResponse.json({ error: "Assignee must be a household member or null." }, { status: 400 });
  }

  if (typeof assignedToId === "string") {
    const householdMember = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: todo.list.householdId,
          userId: assignedToId,
        },
      },
    });

    if (!householdMember) {
      return NextResponse.json({ error: "Assignee must belong to the household." }, { status: 400 });
    }
  }

  const updatedTodo = await prisma.todoItem.update({
    where: { id },
    data: {
      title: body.title.trim(),
      assignedToId,
      description: body.description === null ? null : body.description,
      status: body.status as typeof statuses[number],
      priority: body.priority as typeof priorities[number],
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
