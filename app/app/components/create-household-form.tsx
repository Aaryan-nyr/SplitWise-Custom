"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle, UsersRound } from "lucide-react";

export function CreateHouseholdForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [createInvite, setCreateInvite] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, createInvite }),
      });
      const result = (await response.json()) as {
        invitePath?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "The household could not be created.");
      }

      if (result.invitePath) {
        setInviteUrl(new URL(result.invitePath, window.location.origin).toString());
      } else {
        router.replace("/");
        router.refresh();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The household could not be created. Please try again."
      );
    } finally {
      setIsSaving(false);
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

  if (inviteUrl) {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-950">Your household is ready</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share this one-time invite link with a household member. It expires in one day.
        </p>
        <p className="mt-4 break-all rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
          {inviteUrl}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyInvite}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
          >
            {hasCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {hasCopied ? "Copied" : "Copy invite link"}
          </button>
          <button
            type="button"
            onClick={() => {
              router.replace("/");
              router.refresh();
            }}
            className="inline-flex min-h-10 items-center rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Open household
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>Household name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          autoComplete="organization"
          placeholder="e.g. The Green Street Home"
          required
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm">
        <input
          type="checkbox"
          checked={createInvite}
          onChange={(event) => setCreateInvite(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-sky-700"
        />
        <span>
          <span className="flex items-center gap-2 font-semibold text-slate-800">
            <UsersRound size={16} aria-hidden="true" />
            Create an invite link (optional)
          </span>
          <span className="mt-1 block leading-5 text-slate-500">
            You can also invite people later from your household page.
          </span>
        </span>
      </label>

      {error && <p className="mt-4 text-sm text-rose-700" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-70"
      >
        {isSaving && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
        {isSaving ? "Creating household..." : "Create household"}
      </button>
    </form>
  );
}
