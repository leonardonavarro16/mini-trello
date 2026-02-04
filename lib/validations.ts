import { z } from "zod";

// Schema de validación para el formulario de tareas
// Usa Zod v4 como pide la rúbrica
// Todos los campos son string/number requeridos (no optional)
// para evitar conflictos de tipos con react-hook-form
export const taskFormSchema = z.object({
  titulo: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede superar 100 caracteres"),
  descripcion: z
    .string()
    .max(500, "La descripción no puede superar 500 caracteres"),
  prioridad: z.enum(["low", "medium", "high"], {
    message: "Selecciona una prioridad",
  }),
  tags: z.string(),
  estimacionMin: z
    .number({ message: "Debe ser un número" })
    .min(1, "La estimación debe ser al menos 1 minuto")
    .max(9999, "La estimación no puede superar 9999 minutos"),
  fechaLimite: z.string(),
  horaLimite: z.string(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
