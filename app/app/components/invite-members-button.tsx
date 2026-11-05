"use client";

import { useState } from "react";
import { Check, Copy, LoaderCircle, UserPlus } from "lucide-react";
// does not work yet; invite results in json error
export function InviteMembersButton() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createInvite() {
    setIsCreating(true);
    setError(null);
    setHasCopied(false);

    try {
      const response = await fetch("/api/household-invites", { method: "POST" });
      const result = (await response.json()) as { path?: string; error?: string };

      if (!response.ok || !result.path) {
        throw new Error(result.error ?? "We couldn't create an invite link.");
      }

      setInviteUrl(new URL(result.path, window.location.origin).toString());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't create an invite link. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setHasCopied(true);
      setError(null);
    } catch {
      setError("Copying failed. Select and copy the invite link above.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={createInvite}
        disabled={isCreating}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 disabled:cursor-wait disabled:opacity-70"
      >
        {isCreating ? (
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus size={17} aria-hidden="true" />
        )}
        {isCreating ? "Creating link..." : "Invite members"}
      </button>

      {inviteUrl && (
        <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-3">
          <p className="text-xs font-medium text-slate-700">
            Share this link. It can be used once and expires in 7 days.
          </p>
          <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
            {inviteUrl}
          </p>
          <button
            type="button"
            onClick={copyInvite}
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            {hasCopied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            {hasCopied ? "Copied" : "Copy invite link"}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
