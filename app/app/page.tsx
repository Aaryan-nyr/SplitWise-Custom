import { Prisma } from "@prisma/client";
import { ArrowRight, CheckCircle2, Circle, Wallet } from "lucide-react";
import Link from "next/link";

import { InviteMembersButton } from "./components/invite-members-button";
import { Sidebar } from "./components/sidebar";
import { prisma } from "./lib/prisma";
import { validateUserSession } from "./lib/auth-helpers";

const priorityStyles = {
  LOW: "border-sky-200 bg-sky-50 text-sky-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700",
} as const;

function formatCurrency(amount: Prisma.Decimal) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(amount.toNumber());
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ list?: string }> | { list?: string };
}) {
  const session = await validateUserSession();
  const params = searchParams ? await searchParams : {};
  const requestedListId = params.list?.trim();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  const [list, householdMembers, monthlyExpenses] = membership
    ? await Promise.all([
        prisma.todoList.findFirst({
          where: {
            householdId: membership.householdId,
            ...(requestedListId ? { id: requestedListId } : {}),
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            items: {
              where: { status: { in: ["TODO", "INPROGRESS"] } },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                assignedTo: { select: { name: true, email: true } },
              },
            },
          },
        }),
        prisma.householdMember.findMany({
          where: { householdId: membership.householdId },
          orderBy: { joinedAt: "asc" },
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.expense.findMany({
          where: {
            householdId: membership.householdId,
            expenseDate: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
          orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
          select: {
            totalAmount: true,
            paidById: true,
            paidBy: { select: { id: true, name: true, email: true } },
            splits: {
              select: {
                userId: true,
                amountOwed: true,
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        }),
      ])
    : [null, [], []];

  const todoItems = list?.items ?? [];
  const toDoItems = todoItems.filter((item) => item.status === "TODO").slice(0, 2);
  const inProgressItems = todoItems
    .filter((item) => item.status === "INPROGRESS")
    .slice(0, 2);

  const memberNames = new Map(
    householdMembers.map(({ user }) => [user.id, user.name ?? user.email])
  );
  const owedByTo = new Map<string, Map<string, Prisma.Decimal>>();
  let totalExpenses = new Prisma.Decimal(0);
  let expensesWithoutSplits = 0;

  for (const expense of monthlyExpenses) {
    totalExpenses = totalExpenses.plus(expense.totalAmount);
    memberNames.set(expense.paidBy.id, expense.paidBy.name ?? expense.paidBy.email);

    if (expense.splits.length === 0) {
      expensesWithoutSplits += 1;
      continue;
    }

    for (const split of expense.splits) {
      memberNames.set(split.user.id, split.user.name ?? split.user.email);
      if (split.userId === expense.paidById) continue;

      const creditors = owedByTo.get(split.userId) ?? new Map();
      creditors.set(
        expense.paidById,
        (creditors.get(expense.paidById) ?? new Prisma.Decimal(0)).plus(
          split.amountOwed
        )
      );
      owedByTo.set(split.userId, creditors);
    }
  }

  const settlements: { debtor: string; creditor: string; amount: Prisma.Decimal }[] = [];
  const processedPairs = new Set<string>();
  for (const [debtorId, creditors] of owedByTo) {
    for (const [creditorId, amountOwed] of creditors) {
      const pairKey = [debtorId, creditorId].sort().join(":");
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const reverseAmount =
        owedByTo.get(creditorId)?.get(debtorId) ?? new Prisma.Decimal(0);
      const netAmount = amountOwed.minus(reverseAmount);
      if (netAmount.isPositive()) {
        settlements.push({
          debtor: debtorId,
          creditor: creditorId,
          amount: netAmount,
        });
      } else if (netAmount.isNegative()) {
        settlements.push({
          debtor: creditorId,
          creditor: debtorId,
          amount: netAmount.abs(),
        });
      }
    }
  }

  settlements.sort((a, b) => b.amount.comparedTo(a.amount));

  const currentMonthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(now);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] min-[431px]:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-[1500px] space-y-7">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Household workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Your home, at a glance
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                This month&apos;s expenses and the tasks you&apos;re working on.
              </p>
            </div>
            {membership && <InviteMembersButton />}
          </header>

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <Link
              href="/expenses"
              aria-label="View all household expenses"
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-emerald-300 group-hover:shadow-md sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <Wallet size={17} aria-hidden="true" />
                      Expenses · {currentMonthLabel}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                      {formatCurrency(totalExpenses)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {monthlyExpenses.length}{" "}
                      {monthlyExpenses.length === 1 ? "expense" : "expenses"} added this month
                    </p>
                  </div>
                  <ArrowRight
                    size={19}
                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Who owes whom
                  </h2>
                  {monthlyExpenses.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No expenses have been added this month.
                    </p>
                  ) : settlements.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      {expensesWithoutSplits > 0
                        ? "Owed amounts may be incomplete because some expenses have no recorded splits."
                        : "No outstanding amounts between household members from recorded splits."}
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {settlements.map((settlement, index) => (
                        <li
                          key={`${settlement.debtor}-${settlement.creditor}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/70 px-4 py-3 text-sm"
                        >
                          <span className="text-slate-700">
                            <strong className="font-semibold text-slate-900">
                              {memberNames.get(settlement.debtor) ?? "Household member"}
                            </strong>
                            {" owes "}
                            <strong className="font-semibold text-slate-900">
                              {memberNames.get(settlement.creditor) ?? "Household member"}
                            </strong>
                          </span>
                          <span className="font-bold text-emerald-800">
                            {formatCurrency(settlement.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {expensesWithoutSplits > 0 && settlements.length > 0 && (
                    <p className="mt-3 text-xs leading-5 text-amber-700">
                      {expensesWithoutSplits}{" "}
                      {expensesWithoutSplits === 1 ? "expense has" : "expenses have"} no
                      recorded split; owed amounts may be incomplete.
                    </p>
                  )}
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    Based on this month&apos;s recorded splits; repayments aren&apos;t tracked.
                  </p>
                </div>
              </section>
            </Link>

            <Link
              href="/todo"
              aria-label="View all household to-dos"
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-sky-300 group-hover:shadow-md sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-sky-700">
                      <CheckCircle2 size={17} aria-hidden="true" />
                      To-dos
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      Your next tasks in To Do and In Progress.
                    </p>
                  </div>
                  <ArrowRight
                    size={19}
                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-700"
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      { title: "To Do", items: toDoItems },
                      { title: "In Progress", items: inProgressItems },
                    ] as const
                  ).map(({ title, items }) => (
                    <div key={title}>
                      <h2 className="mb-3 text-sm font-semibold text-slate-900">
                        {title}
                      </h2>
                      {items.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                          Nothing here right now.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {items.map((item) => (
                            <li
                              key={item.id}
                              className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                            >
                              <div className="flex items-start gap-2.5">
                                <Circle
                                  size={16}
                                  className="mt-0.5 shrink-0 text-slate-400"
                                  aria-hidden="true"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-sm font-semibold leading-5 text-slate-900">
                                    {item.title}
                                  </p>
                                  {item.description && (
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityStyles[item.priority]}`}
                                    >
                                      {item.priority}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {item.assignedTo
                                        ? `Assigned to ${item.assignedTo.name ?? item.assignedTo.email}`
                                        : "Unassigned"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
