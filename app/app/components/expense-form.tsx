"use client";

import { useState } from "react";
import { Wallet, PlusCircle } from "lucide-react";

const initialForm = {
  description: "",
  amount: "",
  category: "Groceries",
  paidBy: "",
  date: new Date().toISOString().slice(0, 10),
};
// MVP
// page shoudl be restructured
// essentially shows the previous expenses
// then add expense similiar to the todos
// maybe the top of the page shows a summary; who owes / owed

// enhancement: most frequent payer / adder
// enhancement: categorize expenses by category; show a pie chart of the distribution of expenses by category
// enhancement: create groups

export function ExpenseForm() {
  const [form, setForm] = useState(initialForm);

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    alert(
      `Expense saved: ${form.description} - $${form.amount} (${form.category})`
    );
    setForm(initialForm);
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
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
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
              min="0"
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
            <input
              value={form.paidBy}
              onChange={(event) => handleChange("paidBy", event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Alex"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <span>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => handleChange("date", event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Add expense
          </button>
        </div>
      </form>
    </div>
  );
}