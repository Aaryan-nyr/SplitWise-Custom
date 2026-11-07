import { Prisma } from "@prisma/client";
import { ArrowRight, BarChart3, Receipt, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ExpenseCard } from "../components/expense-card";
import { Sidebar } from "../components/sidebar";
import { AppTopBar } from "../components/app-top-bar";
import { prisma } from "../lib/prisma";
import { requirePageSession } from "../lib/auth-helpers";

function formatCurrency(amount: Prisma.Decimal) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(amount.toNumber());
}

function getMostFrequent(counts: Map<string, { name: string; count: number }>) {
  const maxCount = Math.max(0, ...Array.from(counts.values(), ({ count }) => count));
  if (maxCount === 0) return null;

  return {
    names: Array.from(counts.values())
      .filter(({ count }) => count === maxCount)
      .map(({ name }) => name),
    count: maxCount,
  };
}

export default async function ExpensesPage() {
  const session = await requirePageSession();
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  if (!membership) {
    redirect("/");
  }

  const householdMembers = membership
    ? await prisma.householdMember.findMany({
        where: { householdId: membership.householdId },
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    : [];
  const memberOptions = householdMembers.map(({ user }) => ({
    id: user.id,
    name: user.name ?? user.email,
  }));

  const expenses = membership
    ? await prisma.expense.findMany({
        where: { householdId: membership.householdId },
        orderBy: { expenseDate: "desc" },
        select: {
          id: true,
          title: true,
          totalAmount: true,
          category: true,
          paidById: true,
          createdById: true,
          expenseDate: true,
          paidBy: { select: { name: true, email: true } },
          createdBy: { select: { name: true, email: true } },
          splits: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      })
    : [];
  const totalSpent = expenses.reduce(
    (total, expense) => total.plus(expense.totalAmount),
    new Prisma.Decimal(0)
  );

  const payerCounts = new Map<string, { name: string; count: number }>();
  const submitterCounts = new Map<string, { name: string; count: number }>();
  const monthlyTotals = new Map<string, { total: Prisma.Decimal; count: number }>();

  for (const expense of expenses) {
    const payer = payerCounts.get(expense.paidById);
    payerCounts.set(expense.paidById, {
      name: expense.paidBy.name ?? expense.paidBy.email,
      count: (payer?.count ?? 0) + 1,
    });

    if (expense.createdById && expense.createdBy) {
      const submitter = submitterCounts.get(expense.createdById);
      submitterCounts.set(expense.createdById, {
        name: expense.createdBy.name ?? expense.createdBy.email,
        count: (submitter?.count ?? 0) + 1,
      });
    }

    const monthKey = expense.expenseDate.toISOString().slice(0, 7);
    const month = monthlyTotals.get(monthKey) ?? {
      total: new Prisma.Decimal(0),
      count: 0,
    };
    month.total = month.total.plus(expense.totalAmount);
    month.count += 1;
    monthlyTotals.set(monthKey, month);
  }

  const monthlyCards: {
    key: string;
    label: string;
    total: Prisma.Decimal;
    count: number;
  }[] = Array.from(monthlyTotals, ([key, month]) => {
    const date = new Date(`${key}-01T00:00:00.000Z`);
    return {
      key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
      total: month.total,
      count: month.count,
    };
  }).sort((a, b) => b.key.localeCompare(a.key));

  const mostFrequentPayer = getMostFrequent(payerCounts);
  const mostFrequentSubmitter = getMostFrequent(submitterCounts);
  const latestExpenses = expenses.slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] md:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <AppTopBar userName={session.user.name} userImage={session.user.image} />
        <div className="mx-auto max-w-[1500px] space-y-8">
          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Household
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Expenses
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                See how your household spending is shared over time.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/expenses-add-new-entry"
                className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Add expense
              </Link>
              <Link
                href="/expenses-detailed"
                className="inline-flex h-10 items-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Monthly Breakdowns
              </Link>
            </div>
          </header>

          <section aria-label="All-time expense summary" className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Receipt size={17} aria-hidden="true" />
                All-time expenses
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">
                {formatCurrency(totalSpent)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {expenses.length} {expenses.length === 1 ? "expense" : "expenses"} recorded
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <UserRound size={17} aria-hidden="true" />
                Most frequent payer
              </div>
              <p className="mt-4 text-xl font-bold text-slate-950">
                {mostFrequentPayer?.names.join(" & ") ?? "No expenses yet"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {mostFrequentPayer
                  ? `${mostFrequentPayer.count} expenses paid`
                  : "Payer rankings will appear here"}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <BarChart3 size={17} aria-hidden="true" />
                Most frequent submitter
              </div>
              <p className="mt-4 text-xl font-bold text-slate-950">
                {mostFrequentSubmitter?.names.join(" & ") ?? "No submissions yet"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {mostFrequentSubmitter
                  ? `${mostFrequentSubmitter.count} expenses submitted`
                  : "Tracked for expenses added from now on"}
              </p>
            </article>
          </section>

          <section
            aria-labelledby="latest-expenses-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5">
              <h2
                id="latest-expenses-heading"
                className="mt-1 text-xl font-bold text-slate-950"
              >
                Last 10 expenses
              </h2>
            </div>
            {expenses.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center">
                <h3 className="font-semibold text-slate-900">
                  Begin your household management
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Add your first expense to start tracking shared household spending.
                </p>
              </div>
            ) : latestExpenses.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No expenses have been added yet.
              </p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {latestExpenses.map((expense) => (
                  <li key={expense.id}>
                    <ExpenseCard
                      expense={{
                        id: expense.id,
                        title: expense.title,
                        amount: expense.totalAmount.toFixed(2),
                        category: expense.category,
                        paidById: expense.paidById,
                        paidByName: expense.paidBy.name ?? expense.paidBy.email,
                        createdByName: expense.createdBy
                          ? expense.createdBy.name ?? expense.createdBy.email
                          : null,
                        expenseDate: expense.expenseDate.toISOString(),
                        splits: expense.splits.map((split) => ({
                          userId: split.userId,
                          name: split.user.name ?? split.user.email,
                          amount: split.amountOwed.toFixed(2),
                        })),
                      }}
                      householdMembers={memberOptions}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="monthly-expenses-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5">
              <p className="text-sm font-medium text-emerald-700">Monthly spending</p>
              <h2
                id="monthly-expenses-heading"
                className="mt-1 text-xl font-bold text-slate-950"
              >
                Expenses by month
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Swipe to browse months, or open a detailed breakdown.
              </p>
            </div>

            {monthlyCards.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Add an expense to start your monthly spending history.
              </p>
            ) : (
              <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:-mx-7 sm:px-7">
                {monthlyCards.map((month) => (
                  <Link
                    key={month.key}
                    href={`/expenses/${month.key}`}
                    aria-label={`View detailed expenses for ${month.label}, total ${formatCurrency(month.total)}`}
                    className="group w-64 shrink-0 snap-start rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                  >
                    <p className="text-sm font-medium text-slate-500">{month.label}</p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                      {formatCurrency(month.total)}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs text-slate-500">
                        {month.count} {month.count === 1 ? "expense" : "expenses"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                        Detailed view
                        <ArrowRight
                          size={15}
                          className="transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
