import { useState } from "react";
import { Check, Delete, LoaderCircle, Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BoardStatus, Task } from "./task-card";

type TaskPriority = Task["priority"];

type TaskDetailCardProps = {
  task: Task;
  mode: "create" | "edit";
  assignees: { id: string; name: string }[];
  onClose: () => void;
  onSave: (task: Task, mode: "create" | "edit") => Promise<void>;
  onDeleteSuccess: (task: Task) => void;
};

const statuses: BoardStatus[] = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"];
const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

function formatDate(date: Date) {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TaskDetailCard({ task, mode, assignees, onClose, onSave, onDeleteSuccess }: TaskDetailCardProps) {
  // set the isEditing directly here
  // calling the state setters later causes a re-render which triggers another render leading to infinite loop
  const [isEditing, setIsEditing] = useState(mode === "create");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [draft, setDraft] = useState(task);
  var buttonLabel = mode === "create" ? "Create task" : "Save changes";
  
  // mode === "create" ? setIsEditing(true) : setIsEditing(false);

  function updateDraft(field: keyof Task, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  
  async function saveTask() {
    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(draft, mode);
      setIsConfirming(false);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The task could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }
 async function handleTaskDelete() {
    setConfirmDelete(true);
    setDeleteError(null);

    try{
       const response = await fetch(`/api/todos/${task.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete the task.");
      }
      onClose();
      onDeleteSuccess(task);
    }
      catch (error) {
        setDeleteError(error instanceof Error ? error.message : "The task could not be deleted.");
      }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="presentation" onMouseDown={onClose}>
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="task-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-sky-600 uppercase">Task details</p>
            <CardTitle id="task-detail-title" className="text-xl font-bold text-slate-950">{isEditing ? "Edit task" : task.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close task details" title="Close task details">
            <X aria-hidden="true" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 px-6 py-6">
          {isEditing ? (
            <div className="space-y-4">
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Title</span>
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Description</span>
                <textarea className="min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" value={draft.description ?? ""} onChange={(event) => updateDraft("description", event.target.value)} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm font-medium text-slate-700">
                  <span>Priority</span>
                  <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" value={draft.priority} onChange={(event) => updateDraft("priority", event.target.value)}>
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </label>
              </div>
              <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                <span>Assignee</span>
                <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" value={draft.assignedToId ?? ""} onChange={(event) => updateDraft("assignedToId", event.target.value)}>
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm leading-6 text-slate-600">{task.description || "No description"}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Status: {task.status}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Priority: {task.priority}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">Assignee: {task.assignee}</span>
                </div>
              </div>
              <dl className="grid gap-4 border-y border-slate-100 py-4 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-400">Created by</dt><dd className="font-medium text-slate-700">{task.createdBy || "Not set"}</dd></div>
                <div><dt className="text-slate-400">Assigned to</dt><dd className="font-medium text-slate-700">{task.assignedTo || "Not set"}</dd></div>
                <div><dt className="text-slate-400">Last edited by</dt><dd className="font-medium text-slate-700">{task.lastEditedBy || "Not set"}</dd></div>
                <div><dt className="text-slate-400">Updated</dt><dd className="font-medium text-slate-700">{formatDate(task.updatedAt)}</dd></div>
              </dl>
              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Comments</h2>
                {task.comments?.length ? (
                  <div className="space-y-3">{task.comments.map((comment) => <div key={comment.id} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium text-slate-700">{comment.author}</span><span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span></div><p className="mt-1 text-slate-600">{comment.content}</p></div>)}</div>
                ) : <p className="text-sm text-slate-400">No comments yet.</p>}
              </div>
            </>
          )}
          {/* set state to when editing or confirming changes */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              {isDeleting ? (
                <>
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
                <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-task-title" onMouseDown={(event) => event.stopPropagation()}>
                <CardHeader className="px-6 py-5"><CardTitle id="confirm-task-title" className="text-lg font-bold text-slate-950">Delete this task?</CardTitle></CardHeader>
                <CardContent className="space-y-5 px-6 pb-6">
                  <p className="text-sm leading-6 text-slate-600">This will permanently delete the task from the board.</p>
                  {deleteError &&
                   <p className="text-sm text-rose-600" role="alert">{deleteError}</p>}
                   <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setIsDeleting(false)} disabled={isConfirming}>Cancel Delete</Button><Button onClick={handleTaskDelete} disabled={isConfirming} className="gap-2">{confirmDelete && !deleteError ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Deleting...</> : <><Check aria-hidden="true" />Confirm delete</>}</Button></div></CardContent>
              </Card>
              </div>
              </>
            ) : mode !== "create" && <Button variant="destructive" onClick={() => setIsDeleting(true)} title="Delete Task" className="gap-2"><Trash2 aria-hidden="true" />Delete</Button>
            }
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => { setDraft(task); setIsEditing(false); }}>Cancel</Button>
                <Button onClick={() => setIsConfirming(true)} disabled={!draft.title.trim()}>{buttonLabel}</Button>
              </>
            ) : <Button onClick={() => setIsEditing(true)} className="gap-2"><Pencil aria-hidden="true" />Edit</Button>}
          </div>
        </CardContent>
      </Card>

      {isConfirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-task-title" onMouseDown={(event) => event.stopPropagation()}>
            <CardHeader className="px-6 py-5"><CardTitle id="confirm-task-title" className="text-lg font-bold text-slate-950">Save these changes?</CardTitle></CardHeader>
            <CardContent className="space-y-5 px-6 pb-6"><p className="text-sm leading-6 text-slate-600">This will update the task details on the board.</p>{saveError && <p className="text-sm text-rose-600" role="alert">{saveError}</p>}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setIsConfirming(false)} disabled={isSaving}>Keep editing</Button><Button onClick={saveTask} disabled={isSaving} className="gap-2">{isSaving ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Saving...</> : <><Check aria-hidden="true" />Confirm save</>}</Button></div></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
