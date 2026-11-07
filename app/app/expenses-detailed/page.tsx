import { Prisma } from "@prisma/client";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

export default async function MonthlyExpensesIndexPage() {
  const session = await requirePageSession();
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
        where: { householdId: membership.householdId },
        orderBy: { expenseDate: "desc" },
        select: { expenseDate: true, totalAmount: true },
      })
    : [];

  const monthlyTotals = new Map<string, { total: Prisma.Decimal; count: number }>();
  for (const expense of expenses) {
    const key = expense.expenseDate.toISOString().slice(0, 7);
    const month = monthlyTotals.get(key) ?? {
      total: new Prisma.Decimal(0),
      count: 0,
    };
    month.total = month.total.plus(expense.totalAmount);
    month.count += 1;
    monthlyTotals.set(key, month);
  }

  const months = Array.from(monthlyTotals, ([key, month]) => ({
    key,
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${key}-01T00:00:00.000Z`)),
    ...month,
  })).sort((a, b) => b.key.localeCompare(a.key));

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] md:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <AppTopBar userName={session.user.name} userImage={session.user.image} />
        <div className="mx-auto max-w-[900px] space-y-7">
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Expenses overview
          </Link>

          <header>
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CalendarDays size={17} aria-hidden="true" />
              Expense history
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Monthly breakdowns
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Browse previous months and open a detailed spending breakdown.
            </p>
          </header>

          {months.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
              No monthly expenses yet. Once expenses are added, they&apos;ll appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {months.map((month) => (
                <li key={month.key}>
                  <Link
                    href={`/expenses/${month.key}`}
                    aria-label={`View detailed expenses for ${month.label}, total ${formatCurrency(month.total)}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:p-6"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-500">
                        {month.label}
                      </span>
                      <span className="mt-2 block text-2xl font-bold tracking-tight text-slate-950">
                        {formatCurrency(month.total)}
                      </span>
                      <span className="mt-2 block text-xs text-slate-500">
                        {month.count} {month.count === 1 ? "expense" : "expenses"}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700">
                      Detailed view
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
