"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PlusCircle, Wallet } from "lucide-react";

const initialForm = {
  description: "",
  amount: "",
  category: "Groceries",
  paidBy: "",
  date: new Date().toISOString().slice(0, 10),
};

type HouseholdMember = {
  id: string;
  name: string;
};

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

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Description</span>
            <input
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="0.00"
              required
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) => handleChange("category", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
            <span>Paid by</span>
            <select
              value={form.paidBy}
              onChange={(event) => handleChange("paidBy", event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || householdMembers.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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