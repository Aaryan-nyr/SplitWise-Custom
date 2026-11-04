"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  "Groceries",
  "Utilities",
  "Rent",
  "Transport",
  "Entertainment",
  "Other",
] as const;

export type ExpenseCardData = {
  id: string;
  title: string;
  amount: string;
  category: string;
  paidById: string;
  paidByName: string;
  createdByName: string | null;
  expenseDate: string;
  splits: { name: string; amount: string }[];
};

type HouseholdMember = { id: string; name: string };

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount));
}

function dateInputValue(value: string) {
  return value.slice(0, 10);
}

export function ExpenseCard({
  expense,
  householdMembers,
}: {
  expense: ExpenseCardData;
  householdMembers: HouseholdMember[];
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    paidById: expense.paidById,
    expenseDate: dateInputValue(expense.expenseDate),
  });

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "The expense could not be updated.");
      }

      setIsEditing(false);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The expense could not be updated."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteExpense() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "The expense could not be deleted.");
      }

      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The expense could not be deleted."
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card className="gap-0 border-black/8 bg-white shadow-none transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pt-4 pb-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm leading-5 font-semibold text-slate-900">
              {expense.title}
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">{expense.category}</p>
          </div>
          <p className="shrink-0 text-sm font-bold text-slate-900">
            {formatCurrency(expense.amount)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Paid by {expense.paidByName}</span>
            <time dateTime={expense.expenseDate}>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(expense.expenseDate))}
            </time>
          </div>
          {expense.createdByName && (
            <p className="text-xs text-slate-500">Added by {expense.createdByName}</p>
          )}
          {expense.splits.length > 0 && (
            <p className="text-xs text-slate-500">
              Owed by{" "}
              {expense.splits
                .map((split) => `${split.name} ${formatCurrency(split.amount)}`)
                .join(" · ")}
            </p>
          )}

          {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setIsEditing(true);
              }}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setError(null);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isEditing || isDeleteDialogOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving && !isDeleting) {
              setIsEditing(false);
              setIsDeleteDialogOpen(false);
            }
          }}
        >
          <section
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`expense-dialog-title-${expense.id}`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Expense details
                </p>
                <h2
                  id={`expense-dialog-title-${expense.id}`}
                  className="mt-1 text-xl font-bold text-slate-950"
                >
                  {isDeleteDialogOpen ? "Delete expense?" : "Edit expense"}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setIsEditing(false);
                  setIsDeleteDialogOpen(false);
                }}
                disabled={isSaving || isDeleting}
                aria-label="Close expense dialog"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {isDeleteDialogOpen ? (
              <div className="space-y-5">
                <p className="text-sm leading-6 text-slate-600">
                  This will permanently remove <strong>{expense.title}</strong> and its recorded splits.
                </p>
                {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={deleteExpense}
                    disabled={isDeleting}
                  >
                    {isDeleting && !error ? (
                      <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 aria-hidden="true" />
                        Delete expense
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={saveExpense} className="space-y-4">
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Description</span>
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft("title", event.target.value)}
                    maxLength={200}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Amount</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft.amount}
                    onChange={(event) => updateDraft("amount", event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Category</span>
                  <select
                    value={draft.category}
                    onChange={(event) => updateDraft("category", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Paid by</span>
                  <select
                    value={draft.paidById}
                    onChange={(event) => updateDraft("paidById", event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {householdMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Date</span>
                  <input
                    type="date"
                    value={draft.expenseDate}
                    onChange={(event) => updateDraft("expenseDate", event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
                {error && <p className="text-sm text-rose-600" role="alert">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
