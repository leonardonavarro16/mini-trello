"use client";

import { useState } from "react";
import { Star, BarChart3, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Task, GodModeEval } from "@/types";

interface GodModePanelProps {
  tasks: Task[];
  evaluaciones: GodModeEval[];
  onSaveEval: (eval_: GodModeEval) => void;
}

export function GodModePanel({
  tasks,
  evaluaciones,
  onSaveEval,
}: GodModePanelProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [nota, setNota] = useState<number>(5);
  const [observaciones, setObservaciones] = useState<string>("");

  // Calcular estadísticas
  const evaluadas = evaluaciones.filter((ev) =>
    tasks.some((t) => t.id === ev.taskId)
  );
  const sinEvaluar = tasks.filter(
    (t) => !evaluaciones.some((ev) => ev.taskId === t.id)
  );
  const media =
    evaluadas.length > 0
      ? evaluadas.reduce((sum, ev) => sum + ev.nota, 0) / evaluadas.length
      : 0;

  function getEval(taskId: string): GodModeEval | undefined {
    return evaluaciones.find((ev) => ev.taskId === taskId);
  }

  function startEdit(task: Task) {
    const existente = getEval(task.id);
    setEditingTaskId(task.id);
    setNota(existente?.nota ?? 5);
    setObservaciones(existente?.observaciones ?? "");
  }

  function saveEdit() {
    if (!editingTaskId) return;
    onSaveEval({
      taskId: editingTaskId,
      nota,
      observaciones,
    });
    setEditingTaskId(null);
    setNota(5);
    setObservaciones("");
  }

  function getNotaColor(n: number): string {
    if (n >= 8) return "text-green-600 dark:text-green-400";
    if (n >= 5) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  }

  return (
    <div className="space-y-6">
      {/* Panel Resumen */}
      <Card className="border-amber-300 dark:border-amber-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <BarChart3 className="h-5 w-5" />
            Panel Resumen - Modo Dios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">{media.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Media Global</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold">{evaluadas.length}</p>
              <p className="text-sm text-muted-foreground">Evaluadas</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">
                {sinEvaluar.length}
              </p>
              <p className="text-sm text-muted-foreground">Sin Evaluar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Lista de tareas con evaluación */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Observaciones de Javi por tarea
        </h3>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay tareas para evaluar.</p>
            <p className="text-sm mt-1">Crea tareas en el tablero para poder evaluarlas.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const evalExistente = getEval(task.id);
            const isEditing = editingTaskId === task.id;

            return (
              <Card key={task.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {task.titulo}
                        </h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {task.estado}
                        </Badge>
                      </div>

                      {evalExistente && !isEditing && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span
                              className={`font-bold text-lg ${getNotaColor(
                                evalExistente.nota
                              )}`}
                            >
                              {evalExistente.nota}/10
                            </span>
                          </div>
                          {evalExistente.observaciones && (
                            <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">
                              &quot;{evalExistente.observaciones}&quot;
                            </p>
                          )}
                        </div>
                      )}

                      {!evalExistente && !isEditing && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Sin evaluar
                        </p>
                      )}
                    </div>

                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(task)}
                      >
                        {evalExistente ? "Editar" : "Evaluar"}
                      </Button>
                    )}
                  </div>

                  {/* Formulario de edición inline */}
                  {isEditing && (
                    <div className="mt-3 space-y-3 border-t pt-3">
                      <div className="flex items-center gap-3">
                        <label htmlFor={`nota-${task.id}`} className="text-sm font-medium shrink-0">
                          Nota (0-10):
                        </label>
                        <Input
                          id={`nota-${task.id}`}
                          type="number"
                          min={0}
                          max={10}
                          step={0.5}
                          value={nota}
                          onChange={(e) =>
                            setNota(
                              Math.min(10, Math.max(0, parseFloat(e.target.value) || 0))
                            )
                          }
                          className="w-24"
                          aria-label="Nota de 0 a 10"
                        />
                      </div>
                      <div>
                        <label htmlFor={`obs-${task.id}`} className="text-sm font-medium">
                          Observaciones:
                        </label>
                        <Textarea
                          id={`obs-${task.id}`}
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Comentarios sobre la tarea..."
                          className="mt-1 resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTaskId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={saveEdit}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
