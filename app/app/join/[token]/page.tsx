import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { House, UsersRound } from "lucide-react";

import { authOptions } from "@/app/auth";
import { AcceptHouseholdInviteButton } from "@/app/components/accept-household-invite-button";
import { AppTopBar } from "@/app/components/app-top-bar";
import { SignOutButton } from "@/app/components/sign-out-button";
import {
  hashHouseholdInviteToken,
  isHouseholdInviteToken,
} from "@/app/lib/household-invites";
import { prisma } from "@/app/lib/prisma";

export default async function JoinHouseholdPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/join/${token}`)}`);
  }

  const invitation = isHouseholdInviteToken(token)
    ? await prisma.householdInvite.findUnique({
        where: { tokenHash: hashHouseholdInviteToken(token) },
        select: {
          householdId: true,
          expiresAt: true,
          acceptedAt: true,
          household: { select: { name: true } },
        },
      })
    : null;

  const membership = invitation
    ? await prisma.householdMember.findUnique({
        where: {
          householdId_userId: {
            householdId: invitation.householdId,
            userId: session.user.id,
          },
        },
        select: { householdId: true },
      })
    : null;

  if (invitation && membership?.householdId === invitation.householdId) {
    redirect("/login");
  }

  const inviteIsValid =
    invitation && !invitation.acceptedAt && invitation.expiresAt > new Date();

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <AppTopBar userName={session.user.name} userImage={session.user.image} />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          {inviteIsValid ? (
            <UsersRound size={23} aria-hidden="true" />
          ) : (
            <House size={23} aria-hidden="true" />
          )}
        </div>

        {inviteIsValid ? (
          <>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
              Household invitation
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Join {invitation.household.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You&apos;re signed in as {session.user.email ?? "your Google account"}.
              Join this household to share its tasks and expenses.
            </p>
            <div className="mt-7">
              <AcceptHouseholdInviteButton token={token} />
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
              This invite link is no longer available
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              It may have expired, already been used, or be incorrect. Ask the
              household member who invited you for a new link.
            </p>
          </>
        )}

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link
            href="/"
            className="inline-flex text-sm font-semibold text-sky-800 underline-offset-4 hover:underline"
          >
            Return home
          </Link>
          <SignOutButton className="w-auto" />
        </div>
      </section>
      </div>
    </main>
  );
}
