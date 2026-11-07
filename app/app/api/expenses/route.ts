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

function parsePercentagePoints(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^(?:\d{1,2})(?:\.\d{1,2})?$|^100(?:\.0{1,2})?$/.test(value)
  ) {
    return null;
  }

  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function parseAmountCents(amount: string) {
  return Math.round(Number(amount) * 100);
}

function formatAmountCents(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Expense details are required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const amount = typeof input.amount === "string" ? input.amount : "";
  const paidById = typeof input.paidById === "string" ? input.paidById : "";
  const category = input.category;
  const expenseDate = typeof input.expenseDate === "string" ? input.expenseDate : "";
  const splitsInput = input.splits;

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

  if (!Array.isArray(splitsInput) || splitsInput.length === 0) {
    return NextResponse.json(
      { error: "Add a percentage split for every household member." },
      { status: 400 }
    );
  }

  const parsedSplits: (
    | { userId: string; percentagePoints: number }
    | null
  )[] = splitsInput.map((split) => {
    if (!split || typeof split !== "object" || Array.isArray(split)) return null;
    const entry = split as Record<string, unknown>;
    const percentagePoints = parsePercentagePoints(entry.percentage);

    if (typeof entry.userId !== "string" || !entry.userId || percentagePoints === null) {
      return null;
    }

    return { userId: entry.userId, percentagePoints };
  });

  if (parsedSplits.some((split) => split === null)) {
    return NextResponse.json(
      { error: "Each household member needs a valid percentage from 0 to 100." },
      { status: 400 }
    );
  }

  const splits = parsedSplits.filter(
    (split): split is { userId: string; percentagePoints: number } =>
      split !== null
  );
  if (splits.reduce((total, split) => total + split.percentagePoints, 0) !== 10000) {
    return NextResponse.json(
      { error: "Split percentages must total exactly 100%." },
      { status: 400 }
    );
  }

  const totalCents = parseAmountCents(amount);
  const splitAmounts = splits.map((split, index) => {
    const wholePoints = Math.floor(totalCents / 10000);
    const remainingPoints = totalCents % 10000;
    const weightedRemainder = remainingPoints * split.percentagePoints;
    return {
      ...split,
      index,
      amountCents:
        wholePoints * split.percentagePoints +
        Math.floor(weightedRemainder / 10000),
      remainder: weightedRemainder % 10000,
    };
  });
  let remainingCents =
    totalCents -
    splitAmounts.reduce((total, split) => total + split.amountCents, 0);
  const largestRemainders = [...splitAmounts].sort((a, b) =>
    a.remainder === b.remainder
      ? a.index - b.index
      : a.remainder > b.remainder
        ? -1
        : 1
  );
  for (let index = 0; remainingCents > 0; index += 1) {
    largestRemainders[index].amountCents += 1;
    remainingCents -= 1;
  }

  const expense = await prisma.$transaction(async (transaction) => {
    const householdMembers = await transaction.householdMember.findMany({
      where: { householdId: membership.householdId },
      select: { userId: true },
    });
    const memberIds = new Set(householdMembers.map(({ userId: memberId }) => memberId));

    if (
      splits.length !== memberIds.size ||
      new Set(splits.map(({ userId: splitUserId }) => splitUserId)).size !== splits.length ||
      splits.some(({ userId: splitUserId }) => !memberIds.has(splitUserId))
    ) {
      return null;
    }

    return transaction.expense.create({
      data: {
        householdId: membership.householdId,
        title,
        totalAmount: amount,
        paidById,
        createdById: userId,
        category: validCategory,
        expenseDate: parsedExpenseDate,
        splits: {
          create: splitAmounts.map((split) => ({
            userId: split.userId,
            percentage: `${Math.floor(split.percentagePoints / 100)}.${String(split.percentagePoints % 100).padStart(2, "0")}`,
            amountOwed: formatAmountCents(split.amountCents),
          })),
        },
      },
      select: { id: true },
    });
  });

  if (!expense) {
    return NextResponse.json(
      { error: "Household membership changed. Refresh and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ id: expense.id }, { status: 201 });
}