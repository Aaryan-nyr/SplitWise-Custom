"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BoardColumn } from "./board-column";
import { BoardStatus, Task } from "./task-card";

const statuses: BoardStatus[] = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"];

const initialTasks: Task[] = [
  {
    id: "welcome-board", title: "Plan the weekend groceries", description: "Make a list of essentials before the Saturday shop.", status: "TODO", priority: "MEDIUM", assignee: "AB",
    createdBy: "",
    assignedTo: "",
    lastEditedBy: "",
    updatedAt: new Date()  },
  {
    id: "schedule-repairs",
    title: "Schedule boiler inspection",
    description: "Call the building manager and confirm a time.",
    status: "INPROGRESS",
    priority: "HIGH",
    assignee: "JS",
    createdBy: "",
    assignedTo: "",
    lastEditedBy: "",
    updatedAt: new Date(),
  },
  {
    id: "update-budget",
    title: "Update monthly budget",
    description: "Review the shared expenses from last month.",
    status: "DONE",
    priority: "LOW",
    assignee: "AB",
    createdBy: "",
    assignedTo: "",
    lastEditedBy: "",
    updatedAt: new Date(),
  },
];

export function Board() {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsPopUpOpen(true);
  };

  function moveDraggedTask(status: BoardStatus) {
    if (!draggedTaskId) return;
    setTasks((currentTasks) => currentTasks.map((task) => task.id === draggedTaskId ? { ...task, status } : task));
    setDraggedTaskId(null);
  }

  function addTask(status: BoardStatus = "TODO") {
    const title = window.prompt("Card title");
    if (!title?.trim()) return;
    setTasks((currentTasks) => [...currentTasks, {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: "New household task",
      status,
      priority: "MEDIUM",
      assignee: "ME",
      createdBy: "ME",
      assignedTo: "ME",
      lastEditedBy: "ME",
      updatedAt: new Date(),
    }]);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-sky-600 uppercase">Household workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Weekly ToDos</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Keep the small things moving, together.</p>
        </div>
        <Button onClick={() => addTask()} className="gap-2 self-start sm:self-auto"><Plus aria-hidden="true" />Add card</Button>
      </div>
      <div className="grid gap-4 overflow-x-auto pb-4 xl:grid-cols-4">
        {statuses.map((status) => <BoardColumn key={status} status={status} tasks={tasks.filter((task) => task.status === status)} onDragStart={setDraggedTaskId} onDrop={moveDraggedTask} onTaskSelect={handleTaskClick} onAddTask={() => addTask(status)} />)}
      </div>
    </section>
  );
}
