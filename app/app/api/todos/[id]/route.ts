import { NextResponse } from "next/server";
import { validateTodoInput, validateUserSession } from "@/app/lib/auth-helpers";
import { prisma } from "@/app/lib/prisma";

import {
  type ValidatedTodoInput,
  type UpdateTodoBody,
} from "@/app/lib/task-constants";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await validateUserSession();
  const body = await request.json() as UpdateTodoBody;

  let validatedInput: ValidatedTodoInput;
  try {
    validatedInput = validateTodoInput(body, "update");
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  const result = await prisma.todoItem.updateMany({
    where: {
      id,
      list: { household: { members: { some: { userId: session.user.id } } } },
    },
    data: {
      title: validatedInput.title,
      assignedToId: validatedInput.assignedToId,
      description: validatedInput.description,
      status: validatedInput.status,
      priority: validatedInput.priority,
      lastEditedById: session.user.id,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const updatedTodo = await prisma.todoItem.findUniqueOrThrow({
    where: { id },
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await validateUserSession();

  const deletedTodo = await prisma.todoItem.deleteMany({
    where: {
      id,
      list: { household: { members: { some: { userId: session.user.id } } } },
    },
  });
   
  if (deletedTodo.count === 0) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  return NextResponse.json({ message: "Task deleted successfully." });

}