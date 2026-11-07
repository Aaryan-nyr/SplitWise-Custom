"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PlusCircle, Wallet } from "lucide-react";

const initialForm = {
  description: "",
  amount: "",
  owes: "",
  category: "Groceries",
  paidBy: "",
  date: new Date().toISOString().slice(0, 10),
};

type HouseholdMember = {
  id: string;
  name: string;
};

type SplitPercentage = {
  userId: string;
  percentage: string;
};

function parsePercentagePoints(value: string) {
  if (!/^(?:\d{1,2})(?:\.\d{1,2})?$|^100(?:\.0{1,2})?$/.test(value)) {
    return null;
  }

  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

// default values for perecentage based split based on number of members
function createEqualSplits(members: HouseholdMember[]): SplitPercentage[] {
  if (members.length === 0) return [];

  const basePercentage = Math.floor(10000 / members.length);
  const extraPoints = 10000 % members.length;

  return members.map((member, index) => {
    const points = basePercentage + (index < extraPoints ? 1 : 0);
    return {
      userId: member.id,
      percentage: `${Math.floor(points / 100)}.${String(points % 100).padStart(2, "0")}`,
    };
  });
}

export function ExpenseForm({
  householdMembers,
  currentUserId,
}: {
  householdMembers: HouseholdMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const defaultPayerId =
    householdMembers.find((member) => member.id === currentUserId)?.id ??
    householdMembers[0]?.id ??
    "";

  const [form, setForm] = useState({
    ...initialForm,
    paidBy: defaultPayerId,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [splitPercentages, setSplitPercentages] = useState(() =>
    createEqualSplits(householdMembers)
  );

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const splitPoints = splitPercentages.map((split) =>
    parsePercentagePoints(split.percentage)
  );
  const splitTotal = splitPoints.reduce(
    (total: number, points) => total + (points ?? 0),
    0
  );
  const splitIsValid =
    splitPoints.every((points) => points !== null) && splitTotal === 10000;

  function updateSplit(userId: string, percentage: string) {
    setSplitPercentages((current) =>
      current.map((split) =>
        split.userId === userId ? { ...split, percentage } : split
      )
    );
  }

  function resetEqualSplit() {
    setSplitPercentages(createEqualSplits(householdMembers));
    setIsCustomSplit(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!splitIsValid) {
      setError("Split percentages must total exactly 100%.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.description,
          amount: form.amount,
          category: form.category,
          paidById: form.paidBy,
          expenseDate: form.date,
          splits: splitPercentages,
        }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "The expense could not be saved.");
      }

      router.push("/expenses");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The expense could not be saved. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Household
          </p>
          <h2 className="text-2xl font-bold text-slate-900">Add an expense</h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <section className="space-y-4" aria-labelledby="split-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 id="split-heading" className="text-base font-semibold text-slate-900">
                Expense split
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Shares are percentages of the total. The selected payer paid the
                full expense upfront.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={isCustomSplit}
              aria-controls="custom-split-panel"
              onClick={() =>
                isCustomSplit
                  ? resetEqualSplit()
                  : setIsCustomSplit(true)
              }
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              {isCustomSplit ? "Use equal split" : "Custom split percent"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {splitPercentages.map((split) => {
              const member = householdMembers.find(({ id }) => id === split.userId);
              return (
                <span
                  key={split.userId}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                >
                  {member?.name ?? "Household member"}: {split.percentage}%
                </span>
              );
            })}
          </div>

          {isCustomSplit && (
            <div
              id="custom-split-panel"
              className="space-y-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 sm:p-5"
            >
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Custom split percent
                </h4>
                <p className="mt-1 text-sm text-slate-600">
                  Set each household member&apos;s share. The percentages must add up
                  to 100%.
                </p>
              </div>
              {householdMembers.map((member) => {
                const split = splitPercentages.find(
                  ({ userId }) => userId === member.id
                );
                return (
                  <label
                    key={member.id}
                    className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>{member.name}</span>
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        inputMode="decimal"
                        value={split?.percentage ?? "0.00"}
                        onChange={(event) =>
                          updateSplit(member.id, event.target.value)
                        }
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base sm:w-32"
                        aria-label={`${member.name} split percentage`}
                      />
                      <span>%</span>
                    </span>
                  </label>
                );
              })}
              <p
                className={`text-sm font-semibold ${splitIsValid ? "text-emerald-700" : "text-rose-700"}`}
                aria-live="polite"
              >
                Total: {(Number(splitTotal) / 100).toFixed(2)}%{splitIsValid ? "" : " — must equal 100%"}
              </p>
            </div>
          )}
        </section>

        <div className="grid gap-x-5 gap-y-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Description</span>
            <input
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Groceries, gas, rent..."
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Amount</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => handleChange("amount", event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="0.00"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) => handleChange("category", event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              <option>Groceries</option>
              <option>Utilities</option>
              <option>Rent</option>
              <option>Transport</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Who owes?</span>
            <select
              value={form.owes}
              onChange={(event) => handleChange("paidBy", event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            >
              {householdMembers.length === 0 ? (
                <option value="">No household members found</option>
              ) : (
                householdMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Paid by</span>
            <select
              value={form.paidBy}
              onChange={(event) => handleChange("paidBy", event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            >
              {householdMembers.length === 0 ? (
                <option value="">No household members found</option>
              ) : (
                householdMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Date</span>
            <input
              value={form.date}
              type="date"
              onChange={(event) => handleChange("date", event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || householdMembers.length === 0 || !splitIsValid}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Add expense"}
          </button>
        </div>
      </form>
    </div>
  );
}