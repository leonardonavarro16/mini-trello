import { BoardState, INITIAL_BOARD_STATE, Task, AuditEvent, GodModeEval } from "@/types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "micro-trello-board";

// Cargar el estado del tablero desde localStorage
export function loadBoard(): BoardState {
  if (typeof window === "undefined") return INITIAL_BOARD_STATE;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return INITIAL_BOARD_STATE;

  try {
    const parsed = JSON.parse(raw) as BoardState;
    // Validación básica de estructura
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.auditLog)) {
      return INITIAL_BOARD_STATE;
    }
    return parsed;
  } catch {
    return INITIAL_BOARD_STATE;
  }
}

// Guardar el estado completo del tablero en localStorage
export function saveBoard(state: BoardState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Exportar el estado como un archivo JSON descargable
export function exportBoardJSON(state: BoardState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `micro-trello-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Errores de validación al importar
export interface ImportValidationError {
  campo: string;
  mensaje: string;
}

// Validar que una tarea tiene todos los campos requeridos
function validateTask(task: Partial<Task>, index: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  const prefix = `tasks[${index}]`;

  if (!task.id || typeof task.id !== "string") {
    errors.push({ campo: `${prefix}.id`, mensaje: "Falta id o no es string" });
  }
  if (!task.titulo || typeof task.titulo !== "string" || task.titulo.length < 3) {
    errors.push({ campo: `${prefix}.titulo`, mensaje: "Falta titulo o tiene menos de 3 caracteres" });
  }
  if (typeof task.descripcion !== "string") {
    errors.push({ campo: `${prefix}.descripcion`, mensaje: "descripcion debe ser string" });
  }
  if (!["low", "medium", "high"].includes(task.prioridad as string)) {
    errors.push({ campo: `${prefix}.prioridad`, mensaje: "prioridad debe ser low, medium o high" });
  }
  if (!Array.isArray(task.tags)) {
    errors.push({ campo: `${prefix}.tags`, mensaje: "tags debe ser un array" });
  }
  if (typeof task.estimacionMin !== "number" || task.estimacionMin < 0) {
    errors.push({ campo: `${prefix}.estimacionMin`, mensaje: "estimacionMin debe ser un número >= 0" });
  }
  if (!task.fechaCreacion || typeof task.fechaCreacion !== "string") {
    errors.push({ campo: `${prefix}.fechaCreacion`, mensaje: "Falta fechaCreacion" });
  }
  if (typeof task.fechaLimite !== "string") {
    errors.push({ campo: `${prefix}.fechaLimite`, mensaje: "fechaLimite debe ser string" });
  }
  if (!["todo", "doing", "done"].includes(task.estado as string)) {
    errors.push({ campo: `${prefix}.estado`, mensaje: "estado debe ser todo, doing o done" });
  }

  return errors;
}

// Validar un evento de auditoría
function validateAuditEvent(event: Partial<AuditEvent>, index: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  const prefix = `auditLog[${index}]`;

  if (!event.id || typeof event.id !== "string") {
    errors.push({ campo: `${prefix}.id`, mensaje: "Falta id" });
  }
  if (!event.timestamp || typeof event.timestamp !== "string") {
    errors.push({ campo: `${prefix}.timestamp`, mensaje: "Falta timestamp" });
  }
  if (!["CREATE", "UPDATE", "DELETE", "MOVE"].includes(event.accion as string)) {
    errors.push({ campo: `${prefix}.accion`, mensaje: "accion debe ser CREATE, UPDATE, DELETE o MOVE" });
  }
  if (!event.taskId || typeof event.taskId !== "string") {
    errors.push({ campo: `${prefix}.taskId`, mensaje: "Falta taskId" });
  }

  return errors;
}

// Resultado de la importación
export interface ImportResult {
  success: boolean;
  errors: ImportValidationError[];
  board: BoardState | null;
  idsRegenerados: number;
}

// Importar un JSON y validar su contenido
export function importBoardJSON(
  jsonString: string,
  existingTasks: Task[]
): ImportResult {
  let parsed: BoardState;

  try {
    parsed = JSON.parse(jsonString) as BoardState;
  } catch {
    return {
      success: false,
      errors: [{ campo: "JSON", mensaje: "El archivo no contiene JSON válido" }],
      board: null,
      idsRegenerados: 0,
    };
  }

  // Validar estructura raíz
  if (!parsed || typeof parsed !== "object") {
    return {
      success: false,
      errors: [{ campo: "root", mensaje: "El JSON no es un objeto válido" }],
      board: null,
      idsRegenerados: 0,
    };
  }

  if (!Array.isArray(parsed.tasks)) {
    return {
      success: false,
      errors: [{ campo: "tasks", mensaje: "El campo tasks debe ser un array" }],
      board: null,
      idsRegenerados: 0,
    };
  }

  if (!Array.isArray(parsed.auditLog)) {
    return {
      success: false,
      errors: [{ campo: "auditLog", mensaje: "El campo auditLog debe ser un array" }],
      board: null,
      idsRegenerados: 0,
    };
  }

  // Validar cada tarea
  const allErrors: ImportValidationError[] = [];
  parsed.tasks.forEach((task, i) => {
    allErrors.push(...validateTask(task, i));
  });

  // Validar cada evento de auditoría
  parsed.auditLog.forEach((event, i) => {
    allErrors.push(...validateAuditEvent(event, i));
  });

  // Si hay errores de campos, NO importar
  if (allErrors.length > 0) {
    return {
      success: false,
      errors: allErrors,
      board: null,
      idsRegenerados: 0,
    };
  }

  // Resolver IDs duplicados: regenerar si ya existen en el tablero actual
  const existingIds = new Set(existingTasks.map((t) => t.id));
  let idsRegenerados = 0;

  const resolvedTasks = parsed.tasks.map((task) => {
    if (existingIds.has(task.id)) {
      const oldId = task.id;
      const newId = uuidv4();
      idsRegenerados++;
      // Actualizar también las referencias en auditLog
      parsed.auditLog = parsed.auditLog.map((event) =>
        event.taskId === oldId ? { ...event, taskId: newId } : event
      );
      return { ...task, id: newId };
    }
    return task;
  });

  // Asegurar que godModeEvals existe
  const godModeEvals: GodModeEval[] = Array.isArray(parsed.godModeEvals)
    ? parsed.godModeEvals
    : [];

  return {
    success: true,
    errors: [],
    board: {
      tasks: resolvedTasks,
      auditLog: parsed.auditLog,
      godModeEvals,
      godModeEnabled: parsed.godModeEnabled ?? false,
    },
    idsRegenerados,
  };
}
