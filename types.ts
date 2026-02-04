// =============================================
// MODELO DE DATOS - Micro Trello (Broker Tasks)
// =============================================

// Estados posibles del Kanban (columnas)
export type TaskStatus = "todo" | "doing" | "done";

// Niveles de prioridad
export type Priority = "low" | "medium" | "high";

// Acciones que se registran en auditoría
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "MOVE";

// Tarea principal del Kanban
export interface Task {
  id: string; // UUID generado con la librería uuid
  titulo: string; // Mínimo 3 caracteres
  descripcion: string; // Opcional (puede ser string vacío)
  prioridad: Priority;
  tags: string[]; // Ej: ["mercado", "cliente-vip", "urgente"]
  estimacionMin: number; // Minutos estimados para completar
  fechaCreacion: string; // ISO 8601 (se genera automáticamente)
  fechaLimite: string; // ISO 8601 o string vacío si no tiene
  estado: TaskStatus; // En qué columna está
}

// Evaluación del Modo Dios (observaciones de Javi)
export interface GodModeEval {
  taskId: string;
  nota: number; // 0-10
  observaciones: string; // Comentarios de Javi
}

// Registro de cambio individual en un campo
export interface FieldDiff {
  campo: string; // Nombre del campo que cambió
  antes: string | number | string[] | null; // Valor anterior
  despues: string | number | string[] | null; // Valor nuevo
}

// Evento de auditoría
export interface AuditEvent {
  id: string; // UUID del evento
  timestamp: string; // ISO 8601
  accion: AuditAction;
  taskId: string; // ID de la tarea afectada
  taskTitulo: string; // Título para referencia rápida
  diff: FieldDiff[]; // Qué cambió (antes/después)
  userLabel: string; // Siempre "Alumno/a"
}

// Estado completo del tablero (lo que se persiste)
export interface BoardState {
  tasks: Task[];
  auditLog: AuditEvent[];
  godModeEvals: GodModeEval[];
  godModeEnabled: boolean;
}

// Datos del formulario para crear/editar tarea
export interface TaskFormData {
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  tags: string;
  estimacionMin: number;
  fechaLimite: string;
}

// Columna del Kanban con su metadata
export interface KanbanColumn {
  id: TaskStatus;
  titulo: string;
  color: string; // Clase de Tailwind para el color del header
}

// Constante con la definición de columnas
export const COLUMNS: KanbanColumn[] = [
  { id: "todo", titulo: "Por Hacer", color: "bg-blue-500" },
  { id: "doing", titulo: "En Progreso", color: "bg-amber-500" },
  { id: "done", titulo: "Completado", color: "bg-green-500" },
];

// Estado inicial vacío del tablero
export const INITIAL_BOARD_STATE: BoardState = {
  tasks: [],
  auditLog: [],
  godModeEvals: [],
  godModeEnabled: false,
};
