import { z } from "zod";

// Schema de validación para el formulario de tareas
// Usa Zod como pide la rúbrica
export const taskFormSchema = z.object({
  titulo: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede superar 100 caracteres"),
  descripcion: z
    .string()
    .max(500, "La descripción no puede superar 500 caracteres")
    .optional()
    .default(""),
  prioridad: z.enum(["low", "medium", "high"], {
    required_error: "Selecciona una prioridad",
  }),
  tags: z
    .string()
    .optional()
    .default(""),
  estimacionMin: z
    .number({ invalid_type_error: "Debe ser un número" })
    .min(1, "La estimación debe ser al menos 1 minuto")
    .max(9999, "La estimación no puede superar 9999 minutos"),
  fechaLimite: z
    .string()
    .optional()
    .default(""),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
