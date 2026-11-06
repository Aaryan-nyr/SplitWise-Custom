
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { BoardColumn } from "./board-column";
import { TaskDetailCard } from "./task-detail-card";
import { BoardStatus, Task } from "./task-card";
import { Navbar } from "../navbar";


const statuses: BoardStatus[] = ["TODO", "INPROGRESS", "DONE", "OBSOLETE"];

type Assignee = { id: string; name: string };

export function Board({ currentListId, assignees }: { currentListId: string; assignees: Assignee[] }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // invoke when currentListId changes; fetch tasks from the API
  useEffect(() => {
    async function fetchTasks() {
      if (!currentListId) {
        setTasks([]);
        return;
      }

      const response = await fetch(`/api/todos?list=${currentListId}`);
      if (!response.ok) {
        setTasks([]);
        return;
      }
      // parse the response as JSON and set the tasks state
      const data = await response.json();
      const nextTasks = Array.isArray(data) ? data : data.tasks ?? [];
      setTasks(nextTasks);
    }

    fetchTasks();
  }, [currentListId]);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("edit");


  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsPopUpOpen(true);
    setMode("edit");
  };

  // when a Add task is clicked; set the selected task to a new empty task and open the popup in create mode
  const handleAddTask = (status: BoardStatus = "TODO") => {
    const newEmptyTask: Task = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      status,
      priority: "MEDIUM",
      assignedToId: null,
      assignedTo: "Unassigned",
      createdBy: "ME",
      assignee: "ME",
      lastEditedBy: "ME",
      updatedAt: new Date(),
      comments: []
    }

    setSelectedTask(newEmptyTask);
    setMode("create");
    setIsPopUpOpen(true);
  }

  async function handleTaskSave(task: Task, mode: "create" | "edit") {
    if (mode === "create") {
      // Create a new task
      const response = await fetch(`/api/todos?list=${currentListId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignedToId: task.assignedToId,
        }),
      });

      const result = await response.json() as Task | { error?: string };
      if (!response.ok || !("id" in result)) {
        throw new Error("error" in result ? result.error : "The task could not be created.");
      }

      setTasks((currentTasks) => [...currentTasks, result]);
      setSelectedTask(result);
      
    }
    else {
      const response = await fetch(`/api/todos/${task.id}?list=${currentListId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task .title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedToId: task.assignedToId,
      }),
      
    });

    const result = await response.json() as Task | { error?: string };
    if (!response.ok || !("id" in result)) {
      throw new Error("error" in result ? result.error : "The task could not be saved.");
    }

    setTasks((currentTasks) => currentTasks.map((task) => task.id === result.id ? result : task));
    setSelectedTask(result);
    }
  }

  function moveDraggedTask(status: BoardStatus) {
    if (!draggedTaskId) return;
    setTasks((currentTasks) => currentTasks.map((task) => task.id === draggedTaskId ? { ...task, status } : task));
    setDraggedTaskId(null);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Navbar />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            onClick={() => handleAddTask()}
            className="h-10 gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-800"
          >
            <Plus aria-hidden="true" />
            Add Task
          </Button>
        </div>
      </header>
      {tasks.length === 0 && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-6 text-center">
          <h2 className="font-semibold text-slate-900">
            Begin your household management
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Add your first to-do to start organizing your household together.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 xl:grid-cols-4">
        {statuses.map((status) => <BoardColumn key={status} status={status} tasks={tasks.filter((task) => task.status === status)} onDragStart={setDraggedTaskId} onDrop={moveDraggedTask} onTaskSelect={handleTaskClick} onAddTask={() => handleAddTask(status)} />)}
      </div>
      {isPopUpOpen && selectedTask && <TaskDetailCard task={selectedTask} mode={mode} assignees={assignees} onClose={() => setIsPopUpOpen(false)} onSave={handleTaskSave} onDeleteSuccess={
        (selectedTask) => {setIsPopUpOpen(false)
        setTasks((currentTasks) => currentTasks.filter((task) => task.id !== selectedTask.id))
      }} />}
    </section>
  );
}
