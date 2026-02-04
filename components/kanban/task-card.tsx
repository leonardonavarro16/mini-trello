"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock, Calendar, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const prioridadConfig = {
  low: { label: "Baja", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  medium: { label: "Media", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  high: { label: "Alta", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const pConfig = prioridadConfig[task.prioridad];
  const estaVencida =
    task.fechaLimite && new Date(task.fechaLimite) < new Date() && task.estado !== "done";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 cursor-grab active:cursor-grabbing ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      } ${estaVencida ? "border-red-400" : ""}`}
      role="listitem"
      aria-label={`Tarea: ${task.titulo}, prioridad ${pConfig.label}`}
    >
      <CardHeader className="p-3 pb-1 flex flex-row items-start gap-2">
        <button
          className="mt-1 cursor-grab text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded"
          aria-label="Arrastrar tarea"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">
            {task.titulo}
          </h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(task)}
                aria-label={`Editar tarea ${task.titulo}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(task)}
                aria-label={`Eliminar tarea ${task.titulo}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1 space-y-2">
        {task.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.descripcion}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={pConfig.className}>
            {pConfig.label}
          </Badge>
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimacionMin}min
          </span>
          {task.fechaLimite && (
            <span
              className={`flex items-center gap-1 ${
                estaVencida ? "text-red-500 font-medium" : ""
              }`}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.fechaLimite).toLocaleDateString("es-ES")}
              {estaVencida && " (vencida)"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
