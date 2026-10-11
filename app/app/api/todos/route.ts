import { NextResponse } from "next/server";
import { validateUserSession, validateTodoInput, validateListId } from "@/app/lib/auth-helpers";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  type TaskStatus,
  type TaskPriority,
  type ValidatedTodoInput,
  type TodoInput,
  type NewTodoBody,
} from "@/app/lib/task-constants";

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

    const session = await validateUserSession();

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
