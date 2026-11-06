import { Board } from "../components/board/board";
import { Sidebar } from "../components/sidebar";
import { AppTopBar } from "../components/app-top-bar";
import { prisma } from "../lib/prisma";
import { redirect } from "next/navigation";
import { validateUserSession } from "../lib/auth-helpers";

export default async function TodoPage({
  searchParams,
}: {
  searchParams?: Promise<{ list?: string }> | { list?: string };
}) {
    
  const session = await validateUserSession();

  const userId = session.user.id;
  const params = searchParams ? await searchParams : {};
  const requestedListId = params.list?.trim();

  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  if (!membership) {
    redirect("/");
  }

  const list = membership
    ? await prisma.todoList.findFirst({
        where: {
          householdId: membership.householdId,
          ...(requestedListId ? { id: requestedListId } : {}),
        },
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
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] md:flex-row">
      <Sidebar />

      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <AppTopBar userName={session.user.name} userImage={session.user.image} />
        <div className="mx-auto max-w-[1500px]">
          <Board
            currentListId={list?.id ?? ""}
            assignees={list?.household.members.map(({ user }) => ({
              id: user.id,
              name: user.name ?? user.email,
            })) ?? []}
          />
        </div>
      </main>
    </div>
  );
}