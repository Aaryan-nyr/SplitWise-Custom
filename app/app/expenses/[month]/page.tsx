import { Prisma } from "@prisma/client";
import { ArrowLeft, CalendarDays, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ExpenseCard } from "../../components/expense-card";
import { Sidebar } from "../../components/sidebar";
import { AppTopBar } from "../../components/app-top-bar";
import { prisma } from "../../lib/prisma";
import { validateUserSession } from "../../lib/auth-helpers";

const chartColors = ["#0284c7", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0891b2"];

function formatCurrency(amount: Prisma.Decimal) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(amount.toNumber());
}

export default async function MonthlyExpensesPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) notFound();

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (year < 1000 || monthNumber < 1 || monthNumber > 12) notFound();

  const monthStart = new Date(Date.UTC(year, monthNumber - 1, 1));
  const nextMonthStart = new Date(Date.UTC(year, monthNumber, 1));
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthStart);

  const session = await validateUserSession();
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });
  if (!membership) {
    redirect("/");
  }

  const expenses = membership
    ? await prisma.expense.findMany({
        where: {
          householdId: membership.householdId,
          expenseDate: { gte: monthStart, lt: nextMonthStart },
        },
        orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
        include: {
          paidBy: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          splits: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      })
    : [];
  const householdMembers = membership
    ? await prisma.householdMember.findMany({
        where: { householdId: membership.householdId },
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      })
    : [];

  const balanceByUser = new Map<
    string,
    {
      id: string;
      name: string;
      paid: Prisma.Decimal;
      owed: Prisma.Decimal;
    }
  >();

  for (const { user } of householdMembers) {
    balanceByUser.set(user.id, {
      id: user.id,
      name: user.name ?? user.email,
      paid: new Prisma.Decimal(0),
      owed: new Prisma.Decimal(0),
    });
  }

  const totalSpent = expenses.reduce(
    (total, expense) => total.plus(expense.totalAmount),
    new Prisma.Decimal(0)
  );

  for (const expense of expenses) {
    const payer = balanceByUser.get(expense.paidById) ?? {
      id: expense.paidById,
      name: expense.paidBy.name ?? expense.paidBy.email,
      paid: new Prisma.Decimal(0),
      owed: new Prisma.Decimal(0),
    };
    payer.paid = payer.paid.plus(expense.totalAmount);
    balanceByUser.set(payer.id, payer);

    for (const split of expense.splits) {
      const member = balanceByUser.get(split.userId) ?? {
        id: split.userId,
        name: split.user.name ?? split.user.email,
        paid: new Prisma.Decimal(0),
        owed: new Prisma.Decimal(0),
      };
      member.owed = member.owed.plus(split.amountOwed);
      balanceByUser.set(member.id, member);
    }
  }

  const balances = Array.from(balanceByUser.values()).map((member, index) => ({
    ...member,
    net: member.paid.minus(member.owed),
    percentage: totalSpent.isZero()
      ? 0
      : member.paid.dividedBy(totalSpent).mul(100).toNumber(),
    color: chartColors[index % chartColors.length],
  }));
  const hasRecordedSplits = expenses.some((expense) => expense.splits.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] md:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <AppTopBar userName={session.user.name} userImage={session.user.image} />
        <div className="mx-auto max-w-[1100px] space-y-7">
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            All expenses
          </Link>

          <header>
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CalendarDays size={17} aria-hidden="true" />
              Monthly breakdown
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {monthLabel}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              See the household spending, who paid, and how the recorded shares balance out.
            </p>
          </header>

          <section aria-label="Monthly expense summary" className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Receipt size={17} aria-hidden="true" />
                Total expenses
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">
                {formatCurrency(totalSpent)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Spending shares</p>
              {totalSpent.isZero() ? (
                <p className="mt-4 text-sm text-slate-500">
                  There are no expenses for this month yet.
                </p>
              ) : (
                <>
                  <div
                    className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-200"
                    role="img"
                    aria-label={`${monthLabel} spending share by household member`}
                  >
                    {balances.map(
                      (member) =>
                        member.percentage > 0 && (
                          <span
                            key={member.id}
                            title={`${member.name}: ${member.percentage.toFixed(1)}% paid`}
                            style={{
                              width: `${member.percentage}%`,
                              backgroundColor: member.color,
                            }}
                          />
                        )
                    )}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    {balances.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: member.color }}
                          aria-hidden="true"
                        />
                        {member.name}: {member.percentage.toFixed(1)}%
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          </section>

          <section
            aria-labelledby="monthly-balances-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5">
              <h2
                id="monthly-balances-heading"
                className="text-xl font-bold text-slate-950"
              >
                Member balances
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Net is the amount paid minus the amount owed from recorded splits.
              </p>
            </div>
            {balances.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No household members found.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {balances.map((member) => (
                  <li
                    key={member.id}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] sm:items-center"
                  >
                    <p className="truncate font-semibold text-slate-900">
                      {member.name}
                    </p>
                    <div className="flex justify-between gap-2 text-sm sm:block">
                      <span className="text-slate-500">Paid  </span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(member.paid)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-sm sm:block">
                      <span className="text-slate-500">Owed  </span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(member.owed)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-sm sm:block">
                      <span className="text-slate-500">
                        {member.net.isNegative() ? "Owes Total:  " : "Total paid:  "}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(member.net.abs())}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {expenses.length > 0 && !hasRecordedSplits && (
              <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Expense splits have not been recorded for this month, so owed and net balances are incomplete.
              </p>
            )}
          </section>

          <section
            aria-labelledby="monthly-expense-list-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5">
              <h2
                id="monthly-expense-list-heading"
                className="text-xl font-bold text-slate-950"
              >
                Expenses
              </h2>
            </div>
            {expenses.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No expenses recorded for {monthLabel}.
              </p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {expenses.map((expense) => (
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
                          name: split.user.name ?? split.user.email,
                          amount: split.amountOwed.toFixed(2),
                        })),
                      }}
                      householdMembers={householdMembers.map(({ user }) => ({
                        id: user.id,
                        name: user.name ?? user.email,
                      }))}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
