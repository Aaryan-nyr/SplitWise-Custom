import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/auth";
import { prisma } from "@/app/lib/prisma";

const categories = [
  "Groceries",
  "Utilities",
  "Rent",
  "Transport",
  "Entertainment",
  "Other",
] as const;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to add an expense." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expense details are required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const amount = typeof input.amount === "string" ? input.amount : "";
  const paidById = typeof input.paidById === "string" ? input.paidById : "";
  const category = input.category;
  const expenseDate = typeof input.expenseDate === "string" ? input.expenseDate : "";

  if (!title || title.length > 200) {
    return NextResponse.json({ error: "Description is required and must be 200 characters or fewer." }, { status: 400 });
  }

  if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    return NextResponse.json({ error: "Enter an amount greater than zero with up to two decimal places." }, { status: 400 });
  }

  const validCategory =
    typeof category === "string"
      ? categories.find((option) => option === category)
      : undefined;
  if (!validCategory) {
    return NextResponse.json({ error: "Select a valid expense category." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return NextResponse.json({ error: "Select a valid expense date." }, { status: 400 });
  }

  const parsedExpenseDate = new Date(`${expenseDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedExpenseDate.getTime()) || parsedExpenseDate.toISOString().slice(0, 10) !== expenseDate) {
    return NextResponse.json({ error: "Select a valid expense date." }, { status: 400 });
  }

  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Join a household before adding expenses." }, { status: 403 });
  }

  const payerMembership = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: {
        householdId: membership.householdId,
        userId: paidById,
      },
    },
    select: { userId: true },
  });

  if (!payerMembership) {
    return NextResponse.json({ error: "The selected payer is not a member of your household." }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      householdId: membership.householdId,
      title,
      totalAmount: amount,
      paidById,
      createdById: userId,
      category: validCategory,
      expenseDate: parsedExpenseDate,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: expense.id }, { status: 201 });
}