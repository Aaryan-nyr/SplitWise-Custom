"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type EditableField = "name" | "image";

export function ProfileForm({
  name,
  email,
  image,
}: {
  name: string | null;
  email: string;
  image: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState({ name: name ?? "", image: image ?? "" });
  const [draft, setDraft] = useState("");
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const initials =
    values.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || email.slice(0, 1).toUpperCase();

  function startEditing(field: EditableField) {
    setDraft(values[field]);
    setEditingField(field);
    setError(null);
    setNotice(null);
  }

  async function saveField() {
    if (!editingField) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editingField]: draft }),
      });
      const result = (await response.json()) as {
        name?: string | null;
        image?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Your profile could not be updated.");
      }

      const updatedValue = editingField === "name" ? result.name : result.image;
      setValues((current) => ({ ...current, [editingField]: updatedValue ?? "" }));
      setEditingField(null);
      setNotice("Profile updated.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your profile could not be updated."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-5 rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8 md:flex-row md:items-center md:text-left">
        <Avatar className="size-28 shrink-0 ring-4 ring-sky-100">
          {values.image && <AvatarImage src={values.image} alt="" />}
          <AvatarFallback className="bg-sky-100 text-3xl font-semibold text-sky-800">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
            Your profile
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            {values.name || "Add your name"}
          </h1>
          <p className="mt-1 text-base text-slate-600">{email}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select the pencil to edit a field.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          <ProfileField
            label="Display name"
            value={values.name || "Not set"}
            field="name"
            editingField={editingField}
            draft={draft}
            isSaving={isSaving}
            onEdit={startEditing}
            onDraftChange={setDraft}
            onSave={saveField}
            onCancel={() => setEditingField(null)}
          />
          <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">Google account email</p>
              <p className="mt-1 break-all text-base text-slate-900">{email}</p>
              <p className="mt-1 text-sm text-slate-500">
                Email changes are managed by your Google account.
              </p>
            </div>
          </div>
          <ProfileField
            label="Profile photo URL"
            value={values.image || "Not set"}
            field="image"
            editingField={editingField}
            draft={draft}
            isSaving={isSaving}
            onEdit={startEditing}
            onDraftChange={setDraft}
            onSave={saveField}
            onCancel={() => setEditingField(null)}
          />
        </div>
      </section>

      {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
      {notice && <p className="text-sm text-emerald-700" role="status">{notice}</p>}
    </div>
  );
}

function ProfileField({
  label,
  value,
  field,
  editingField,
  draft,
  isSaving,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  field: EditableField;
  editingField: EditableField | null;
  draft: string;
  isSaving: boolean;
  onEdit: (field: EditableField) => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEditing = editingField === field;

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={`profile-${field}`}
          className="text-sm font-medium text-slate-500"
        >
          {label}
        </label>
        {isEditing ? (
          <input
            id={`profile-${field}`}
            autoFocus
            type={field === "image" ? "url" : "text"}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={field === "image" ? "https://example.com/photo.jpg" : "Your name"}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20"
          />
        ) : (
          <p className="mt-1 break-all text-base text-slate-900">{value}</p>
        )}
        {field === "image" && isEditing && (
          <p className="mt-1 text-sm text-slate-500">
            Use an HTTPS image URL. Leave empty to use your initials.
          </p>
        )}
      </div>

      {isEditing ? (
        <div className="flex shrink-0 items-center gap-1 pt-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSave}
            disabled={isSaving}
            aria-label={`Save ${label.toLowerCase()}`}
            title={`Save ${label.toLowerCase()}`}
            className="text-emerald-700 hover:bg-emerald-50"
          >
            <Check aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isSaving}
            aria-label={`Cancel editing ${label.toLowerCase()}`}
            title={`Cancel editing ${label.toLowerCase()}`}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onEdit(field)}
          aria-label={`Edit ${label.toLowerCase()}`}
          title={`Edit ${label.toLowerCase()}`}
          className="shrink-0 text-slate-600 hover:bg-sky-50 hover:text-sky-800"
        >
          <Pencil aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
