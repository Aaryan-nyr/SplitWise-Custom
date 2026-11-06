import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/auth";
import {
  hashHouseholdInviteToken,
  HOUSEHOLD_INVITE_VALIDITY_DAYS,
} from "@/app/lib/household-invites";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sign in before creating a household." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Household details are required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const createInvite = input.createInvite === true;

  if (!name || name.length > 80) {
    return NextResponse.json(
      { error: "Enter a household name of 1 to 80 characters." },
      { status: 400 }
    );
  }

  const existingMembership = await prisma.householdMember.findFirst({
    where: { userId },
    select: { householdId: true },
  });
  if (existingMembership) {
    return NextResponse.json(
      { error: "You already belong to a household." },
      { status: 409 }
    );
  }

  const inviteToken = createInvite ? randomBytes(32).toString("base64url") : null;
  const expiresAt = new Date(
    Date.now() + HOUSEHOLD_INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  );
  const household = await prisma.$transaction(async (transaction) => {
    const createdHousehold = await transaction.household.create({
      data: { name },
      select: { id: true },
    });

    await transaction.householdMember.create({
      data: { householdId: createdHousehold.id, userId },
    });

    await transaction.todoList.create({
      data: {
        householdId: createdHousehold.id,
        title: `${name} To-dos`,
      },
    });

    if (inviteToken) {
      await transaction.householdInvite.create({
        data: {
          tokenHash: hashHouseholdInviteToken(inviteToken),
          householdId: createdHousehold.id,
          createdById: userId,
          expiresAt,
        },
        select: { id: true },
      });
    }

    return createdHousehold;
  });

  return NextResponse.json(
    {
      householdId: household.id,
      invitePath: inviteToken ? `/join/${inviteToken}` : null,
    },
    { status: 201 }
  );
}
