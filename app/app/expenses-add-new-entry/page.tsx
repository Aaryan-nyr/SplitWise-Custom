import Link from "next/link";

import { ExpenseForm } from "../components/expense-form";
import { Sidebar } from "../components/sidebar";
import { validateUserSession } from "../lib/auth-helpers";
import { prisma } from "../lib/prisma";

// session validation to ensure user can actually add to the household
export default async function AddExpensePage() {
  const session = await validateUserSession();
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });
  const householdMembers = membership
    ? await prisma.householdMember.findMany({
        where: { householdId: membership.householdId },
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    : [];
  const members = householdMembers.map(({ user }) => ({
    id: user.id,
    name: user.name ?? user.email,
  }));
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] min-[431px]:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-[1500px] space-y-6">
          <Link
            href="/expenses"
            className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-600"
          >
            Back to expenses
          </Link>
          <ExpenseForm
            householdMembers={members}
            currentUserId={session.user.id}
          />
        </div>
      </main>
    </div>
  );
}
