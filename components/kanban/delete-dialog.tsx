"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Task } from "@/types";

interface DeleteDialogProps {
  open: boolean;
  task: Task | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({
  open,
  task,
  onConfirm,
  onCancel,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar la tarea{" "}
            <strong>&quot;{task?.titulo}&quot;</strong>? Esta acción quedará
            registrada en el log de auditoría y no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
