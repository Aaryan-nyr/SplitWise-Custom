import { GripVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type BoardStatus = "TODO" | "INPROGRESS" | "DONE" | "OBSOLETE";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  createdBy: string;
  assignedTo: string;
  lastEditedBy: string;
  updatedAt: Date;
  status: BoardStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignee: string;
  comments?: {
    id: string; 
    authorId: string;
    author: string;
    updatedAt: Date;
    content: string; 
    createdAt: Date
  }[];

};

const priorityStyles = {
  LOW: "border-sky-200 bg-sky-50 text-sky-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700",
};


export function TaskCard({
  task,
  onSelect,
  onDragStart,
}: {
  task: Task;
  onSelect: (task: Task) => void;
  onDragStart: (taskId: string) => void;
}) {
  return (
    <Card draggable onClick={() => onSelect(task)} onDragStart={() => onDragStart(task.id)} className="cursor-grab gap-0 border-black/8 bg-white shadow-none transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md active:cursor-grabbing">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pt-4 pb-2">
        <CardTitle className="text-sm leading-5 font-semibold text-slate-900">{task.title}</CardTitle>
        <GripVertical className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <p className="text-xs leading-5 text-slate-500">{task.description}</p>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className={priorityStyles[task.priority]}>{task.priority}</Badge>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Avatar className="size-6"><AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-600">{task.assignee}</AvatarFallback></Avatar>
            <span>{task.assignee}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
