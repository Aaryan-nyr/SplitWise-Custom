import { Board } from "./components/board/board";
import { Sidebar } from "./components/sidebar";
import { prisma } from "./lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export default async function Home({searchParams,}: {
  searchParams?: Promise<{ list?: string }> | { list?: string };
}) {
  const session = await getServerSession(authOptions);
  console.log(session)
  if (!session) {
    redirect("/login");
  }
  
  const userId = session.user.id;
  
  //fetch listid from the search params; if not present, fetch the first list in the household
  const params = searchParams ? await searchParams : {};
  const requestedListId = params.list?.trim();
  
  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

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
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <Sidebar />

      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
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
