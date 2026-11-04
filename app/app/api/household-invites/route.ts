import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/auth";
import {
  hashHouseholdInviteToken,
  HOUSEHOLD_INVITE_VALIDITY_DAYS,
} from "@/app/lib/household-invites";
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sign in before creating an invite." }, { status: 401 });
  }

  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { householdId: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Join a household before inviting members." }, { status: 403 });
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + HOUSEHOLD_INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.householdInvite.create({
    data: {
      tokenHash: hashHouseholdInviteToken(token),
      householdId: membership.householdId,
      createdById: userId,
      expiresAt,
    },
    select: { id: true },
  });

  return NextResponse.json({ path: `/join/${token}` }, { status: 201 });
}
