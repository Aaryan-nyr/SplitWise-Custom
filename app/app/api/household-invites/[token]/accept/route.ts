import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/auth";
import {
  hashHouseholdInviteToken,
  isHouseholdInviteToken,
} from "@/app/lib/household-invites";
import { prisma } from "@/app/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Sign in before joining a household." }, { status: 401 });
  }

  const { token } = await params;
  if (!isHouseholdInviteToken(token)) {
    return NextResponse.json({ error: "This invite link is invalid." }, { status: 404 });
  }

  const result = await prisma.$transaction(async (transaction) => {
    //validate invite link; expires after 1 day
    const invite = await transaction.householdInvite.findUnique({
      where: { tokenHash: hashHouseholdInviteToken(token) },
      select: { id: true, householdId: true, expiresAt: true, acceptedAt: true },
    });

    if (!invite) {
      return { status: 404, error: "This invite link is invalid." };
    }

    const existingMembership = await transaction.householdMember.findUnique({
      where: {
        householdId_userId: { householdId: invite.householdId, userId },
      },
      select: { householdId: true },
    });

    if (existingMembership) {
      return { status: 200, redirectTo: "/login" };
    }

    const now = new Date();
    if (invite.acceptedAt || invite.expiresAt <= now) {
      return { status: 410, error: "This invite link has expired or already been used." };
    }

    const claimedInvite = await transaction.householdInvite.updateMany({
      where: { id: invite.id, acceptedAt: null, expiresAt: { gt: now } },
      data: { acceptedAt: now },
    });

    if (claimedInvite.count !== 1) {
      return { status: 410, error: "This invite link has expired or already been used." };
    }

    await transaction.householdMember.create({
      data: { householdId: invite.householdId, userId },
    });

    return { status: 200, householdId: invite.householdId };
  });

  if ("redirectTo" in result) {
    return NextResponse.json({ redirectTo: result.redirectTo }, { status: result.status });
  }

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ householdId: result.householdId }, { status: 200 });
}
