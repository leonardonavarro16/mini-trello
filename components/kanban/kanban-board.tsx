"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { COLUMNS, Task, TaskStatus } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (estado: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function KanbanBoard({
  tasks,
  onMoveTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sensores: pointer (ratón/touch) y teclado para accesibilidad
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Agrupar tareas por columna
  const tasksPorColumna = (status: TaskStatus) =>
    tasks.filter((t) => t.estado === status);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Si se arrastra sobre una columna directamente
    const columnaIds: string[] = COLUMNS.map((c) => c.id);
    if (columnaIds.includes(overId)) {
      const task = tasks.find((t) => t.id === activeId);
      if (task && task.estado !== overId) {
        onMoveTask(activeId, overId as TaskStatus);
      }
      return;
    }

    // Si se arrastra sobre otra tarea, mover a la columna de esa tarea
    const overTask = tasks.find((t) => t.id === overId);
    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (overTask && activeTaskData && activeTaskData.estado !== overTask.estado) {
      onMoveTask(activeId, overTask.estado);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Verificar si soltó sobre una columna
    const columnaIds: string[] = COLUMNS.map((c) => c.id);
    if (columnaIds.includes(overId)) {
      const task = tasks.find((t) => t.id === activeId);
      if (task && task.estado !== overId) {
        onMoveTask(activeId, overId as TaskStatus);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-4 h-full">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            titulo={col.titulo}
            color={col.color}
            tasks={tasksPorColumna(col.id)}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      {/* Overlay: la tarjeta que sigue al cursor mientras arrastras */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
