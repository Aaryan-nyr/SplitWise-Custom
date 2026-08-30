import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BoardStatus, Task,  TaskCard } from "./task-card";

const columnColors: Record<BoardStatus, string> = {
  TODO: "bg-sky-500",
  INPROGRESS: "bg-amber-500",
  DONE: "bg-emerald-500",
  OBSOLETE: "bg-slate-400",
};

export function BoardColumn({
  status,
  tasks,
  onDragStart,
  onDrop,
  onAddTask,
  onTaskSelect,
}: {
  status: BoardStatus;
  tasks: Task[];
  onDragStart: (taskId: string) => void;
  onTaskSelect: (task: Task) => void;
  onDrop: (status: BoardStatus) => void;
  onAddTask: () => void;
}) {

  return (
    <Card onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(status)} className="min-w-[280px] gap-0 border-black/8 bg-slate-50/75 py-0 shadow-none">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 rounded-full ${columnColors[status]}`} />
            <CardTitle className="text-sm font-bold tracking-wide text-slate-800">{status}</CardTitle>
            <span className="text-xs font-medium text-slate-400">{tasks.length}</span>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onAddTask} aria-label={`Add card to ${status}`} title={`Add card to ${status}`} className="text-slate-400 hover:text-slate-900">
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <Separator className="mt-1 bg-slate-200" />
      </CardHeader>
      <CardContent className="flex min-h-[360px] flex-col gap-3 px-3 pb-3">
        {tasks.map((task) => <TaskCard key={task.id} task={task} onSelect={onTaskSelect} onDragStart={onDragStart} />)}
        {tasks.length === 0 && <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">Drop cards here</div>}
      </CardContent>
    </Card>
  );
}
