"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, TaskStatus } from "@/types";
import { taskFormSchema, TaskFormValues } from "@/lib/validations";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TaskFormValues, estado: TaskStatus) => void;
  task?: Task | null;
  defaultEstado?: TaskStatus;
}

export function TaskDialog({
  open,
  onClose,
  onSave,
  task,
  defaultEstado = "todo",
}: TaskDialogProps) {
  const isEditing = !!task;
  const tituloRef = useRef<HTMLInputElement>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      prioridad: "medium",
      tags: "",
      estimacionMin: 30,
      fechaLimite: "",
    },
  });

  // Cuando se abre el dialog, cargar datos si es edición
  useEffect(() => {
    if (open) {
      if (task) {
        form.reset({
          titulo: task.titulo,
          descripcion: task.descripcion,
          prioridad: task.prioridad,
          tags: task.tags.join(", "),
          estimacionMin: task.estimacionMin,
          fechaLimite: task.fechaLimite
            ? task.fechaLimite.slice(0, 10)
            : "",
        });
      } else {
        form.reset({
          titulo: "",
          descripcion: "",
          prioridad: "medium",
          tags: "",
          estimacionMin: 30,
          fechaLimite: "",
        });
      }
      // Foco en el campo título al abrir (accesibilidad)
      setTimeout(() => tituloRef.current?.focus(), 100);
    }
  }, [open, task, form]);

  function onSubmit(values: TaskFormValues) {
    onSave(values, task?.estado ?? defaultEstado);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="sm:max-w-[500px]"
        aria-describedby="task-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
          <DialogDescription id="task-dialog-description">
            {isEditing
              ? "Modifica los datos de la tarea. Los cambios quedarán registrados en auditoría."
              : "Completa los campos para crear una nueva tarea en el tablero."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        (tituloRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                      }}
                      placeholder="Ej: Revisar cartera de inversiones Q4"
                      aria-required="true"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Descripción detallada de la tarea (opcional)"
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Prioridad */}
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="Seleccionar prioridad">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">🟢 Baja</SelectItem>
                        <SelectItem value="medium">🟡 Media</SelectItem>
                        <SelectItem value="high">🔴 Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimación */}
              <FormField
                control={form.control}
                name="estimacionMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimación (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={9999}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        aria-label="Estimación en minutos"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Separados por coma: mercado, cliente-vip, urgente"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha Límite */}
            <FormField
              control={form.control}
              name="fechaLimite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha Límite</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      aria-label="Fecha límite de la tarea"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Guardar cambios" : "Crear tarea"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
