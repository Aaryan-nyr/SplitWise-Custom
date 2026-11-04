import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { validateUserSession } from "@/app/lib/auth-helpers";

const categories = [
  "Groceries",
  "Utilities",
  "Rent",
  "Transport",
  "Entertainment",
  "Other",
] as const;

function parseExpenseInput(input: unknown) {
  if (!input || typeof input !== "object") {
    return { error: "Expense details are required." } as const;
  }

  const body = input as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const amount = typeof body.amount === "string" ? body.amount : "";
  const paidById = typeof body.paidById === "string" ? body.paidById : "";
  const category =
    typeof body.category === "string"
      ? categories.find((option) => option === body.category)
      : undefined;
  const expenseDate =
    typeof body.expenseDate === "string" ? body.expenseDate : "";

  if (!title || title.length > 200) {
    return {
      error: "Description is required and must be 200 characters or fewer.",
    } as const;
  }
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    return {
      error: "Enter an amount greater than zero with up to two decimal places.",
    } as const;
  }
  if (!category) {
    return { error: "Select a valid expense category." } as const;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return { error: "Select a valid expense date." } as const;
  }

  const parsedExpenseDate = new Date(`${expenseDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedExpenseDate.getTime()) ||
    parsedExpenseDate.toISOString().slice(0, 10) !== expenseDate
  ) {
    return { error: "Select a valid expense date." } as const;
  }

  if (!paidById) {
    return { error: "Select a household member who paid." } as const;
  }

  return {
    value: { title, amount, paidById, category, expenseDate: parsedExpenseDate },
  } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await validateUserSession();
  const { id } = await params;
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Join a household before editing expenses." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsed = parseExpenseInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const payerMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: membership.householdId,
        userId: parsed.value.paidById,
      },
    },
    select: { userId: true },
  });
  if (!payerMembership) {
    return NextResponse.json(
      { error: "The selected payer is not a member of your household." },
      { status: 400 }
    );
  }

  const existingExpense = await prisma.expense.findFirst({
    where: { id, householdId: membership.householdId },
    select: {
      id: true,
      splits: { select: { id: true, percentage: true } },
    },
  });
  if (!existingExpense) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  const totalSplitWeight = existingExpense.splits.reduce(
    (total, split) => total + Math.round(split.percentage.toNumber() * 100),
    0
  );
  if (existingExpense.splits.length > 0 && totalSplitWeight <= 0) {
    return NextResponse.json(
      { error: "This expense has invalid split percentages and cannot be updated." },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.expense.update({
      where: { id: existingExpense.id },
      data: {
        title: parsed.value.title,
        totalAmount: parsed.value.amount,
        paidById: parsed.value.paidById,
        category: parsed.value.category,
        expenseDate: parsed.value.expenseDate,
      },
    });
    if (existingExpense.splits.length > 0) {
      const totalCents = Math.round(Number(parsed.value.amount) * 100);
      let allocatedCents = 0;

      for (const [index, split] of existingExpense.splits.entries()) {
        const weight = Math.round(split.percentage.toNumber() * 100);
        const amountCents =
          index === existingExpense.splits.length - 1
            ? totalCents - allocatedCents
            : Math.floor(totalCents * (weight / totalSplitWeight));
        allocatedCents += amountCents;
        await transaction.expenseSplit.update({
          where: { id: split.id },
          data: { amountOwed: (amountCents / 100).toFixed(2) },
        });
      }
    }
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await validateUserSession();
  const { id } = await params;
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Join a household before deleting expenses." },
      { status: 403 }
    );
  }

  const result = await prisma.expense.deleteMany({
    where: { id, householdId: membership.householdId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
