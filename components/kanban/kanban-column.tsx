"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Task, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  id: TaskStatus;
  titulo: string;
  color: string;
  tasks: Task[];
  onAddTask: (estado: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function KanbanColumn({
  id,
  titulo,
  color,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col bg-muted/50 rounded-lg border ${
        isOver ? "ring-2 ring-primary border-primary" : ""
      }`}
      role="list"
      aria-label={`Columna ${titulo}`}
    >
      {/* Header de la columna */}
      <div className={`${color} rounded-t-lg px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white text-sm">{titulo}</h2>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 bg-white/25 text-white font-semibold hover:bg-white/40 hover:text-white rounded-md gap-1"
          onClick={() => onAddTask(id)}
          aria-label={`Añadir tarea a ${titulo}`}
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs">Nueva</span>
        </Button>
      </div>

      {/* Lista de tareas (zona droppable) */}
      <ScrollArea className="flex-1 min-h-[200px] max-h-[calc(100vh-320px)]">
        <div ref={setNodeRef} className="p-2 min-h-[200px]">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
                <p className="text-sm">Sin tareas</p>
                <p className="text-xs mt-1">
                  Arrastra aquí o pulsa + para crear
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))
            )}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
