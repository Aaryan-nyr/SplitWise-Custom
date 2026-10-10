import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";

const statuses = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH"] as const;

type NewTodoBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
  updatedAt?: unknown;
}

type TodoInput = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  assignedToId?: unknown;
  updatedAt?: unknown;
};


type ValidatedTodoInput = {
  title: string;
  description: string | null;
  status: typeof statuses[number];
  priority: typeof priorities[number];
  assignedToId: string | null;
}

function validateListId(listId: unknown): asserts listId is string {
  if (typeof listId !== "string" || !listId.trim()) {
    throw new Error("A valid listId is required.");
  }
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("list");

    validateListId(listId);

    const toDoList = await prisma.todoList.findUnique({
        where: { id: listId },
        include: {
            items: {
                orderBy: { createdAt: "asc" },
                include: {
                    assignedTo: true,
                    createdBy: true,
                    lastEditedBy: true,
                    comments: {
                        orderBy: { createdAt: "asc" },
                        include: { createdBy: true },
                    },
                },
            },}
        })

    // return the tasks in the current list
    return NextResponse.json({
      tasks: (toDoList?.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        assignedToId: item.assignedToId,
        assignedTo: item.assignedTo?.name ?? item.assignedTo?.email ?? "Unassigned",
        createdBy: item.createdBy.name ?? item.createdBy.email,
        lastEditedBy: item.lastEditedBy?.name ?? item.lastEditedBy?.email ?? "Not edited",
        updatedAt: item.updatedAt,
        comments: item.comments.map((comment) => ({
          id: comment.id,
          authorId: comment.createdById,
          author: comment.createdBy.name ?? comment.createdBy.email,
          content: comment.content,
          createdAt: comment.createdAt,
        })),
      })),
    }, { status: 200 });
  
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get("list") as string | undefined;
    validateListId(listId);

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as NewTodoBody;
    let validatedInput: ValidatedTodoInput;
    try {
        validatedInput = validateTodoInput(body, "create");
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    const membership = await prisma.householdMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { joinedAt: "asc" },
      select: { householdId: true },
    });

    const accessibleList = membership
      ? await prisma.todoList.findFirst({
          where: { id: listId, householdId: membership.householdId },
          select: { id: true },
        })
      : null;

    if (!accessibleList) {
      return NextResponse.json({ error: "You do not have access to this list." }, { status: 403 });
    }

    const newToDo = await prisma.todoItem.create({
    data: {
      title: validatedInput.title,
      assignedToId: validatedInput.assignedToId,
      description: validatedInput.description,
      status: validatedInput.status,
      priority: validatedInput.priority,
      listId: listId,
      createdById: session.user.id,
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