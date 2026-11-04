"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, UserRoundPlus } from "lucide-react";

export function AcceptHouseholdInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptInvite() {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/household-invites/${token}/accept`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "We couldn't join this household.");
      }
      router.replace("/");
      router.replace("/");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't join this household. Please try again."
      );
      setIsJoining(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={acceptInvite}
        disabled={isJoining}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-70"
      >
        {isJoining ? (
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
        ) : (
          <UserRoundPlus size={17} aria-hidden="true" />
        )}
        {isJoining ? "Joining..." : "Join household"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
