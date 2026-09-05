import { Board } from "./components/board/board";
import { prisma } from "./lib/prisma";

function initials(name: string | null, email: string) {
  if (name) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export default async function Home() {
  const list = await prisma.todoList.findFirst({
    orderBy: { createdAt: "asc" },
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
      },
      household: {
        include: {
          members: { include: { user: true } },
        },
      },
    },
  });

  const tasks = list?.items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    assignee: item.assignedTo ? initials(item.assignedTo.name, item.assignedTo.email) : "UN",
    createdBy: item.createdBy.name ?? item.createdBy.email,
    assignedTo: item.assignedTo?.name ?? item.assignedTo?.email ?? "Unassigned",
    assignedToId: item.assignedToId,
    lastEditedBy: item.lastEditedBy?.name ?? item.lastEditedBy?.email ?? "Not edited",
    updatedAt: item.updatedAt,
    comments: item.comments.map((comment) => ({
      id: comment.id,
      authorId: comment.createdById,
      author: comment.createdBy.name ?? comment.createdBy.email,
      updatedAt: comment.updatedAt,
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  })) ?? [];

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[1500px]">
        <Board
          initialTasks={tasks}
          assignees={list?.household.members.map(({ user }) => ({
            id: user.id,
            name: user.name ?? user.email,
          })) ?? []}
        />
      </div>
    </main>
  );
}
