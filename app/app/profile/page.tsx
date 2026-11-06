import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppTopBar } from "@/app/components/app-top-bar";
import { InviteMembersButton } from "@/app/components/invite-members-button";
import { ProfileForm } from "@/app/components/profile-form";
import { Sidebar } from "@/app/components/sidebar";
import { validateUserSession } from "@/app/lib/auth-helpers";
import { prisma } from "@/app/lib/prisma";

export default async function ProfilePage() {
  const session = await validateUserSession();
  const [user, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    prisma.householdMember.findFirst({
      where: { userId: session.user.id },
      select: { householdId: true },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9fc] md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <AppTopBar userName={user.name} userImage={user.image} />
        <div className="mx-auto max-w-3xl space-y-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-800 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to household
          </Link>

          <ProfileForm name={user.name} email={user.email} image={user.image} />

          <div className="border-t border-slate-200 pt-6">
            {membership ? (
              <InviteMembersButton />
            ) : (
              <p className="text-sm text-slate-600">
                Create a household before inviting members.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
