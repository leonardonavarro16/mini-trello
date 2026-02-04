import { AuditAction, AuditEvent, FieldDiff, Task } from "@/types";
import { v4 as uuidv4 } from "uuid";

const USER_LABEL = "Alumno/a";

// Calcular las diferencias entre dos versiones de una tarea
// Compara campo por campo y devuelve solo los que cambiaron
export function calcularDiff(antes: Partial<Task>, despues: Partial<Task>): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const campos: (keyof Task)[] = [
    "titulo",
    "descripcion",
    "prioridad",
    "tags",
    "estimacionMin",
    "fechaLimite",
    "estado",
  ];

  for (const campo of campos) {
    const valorAntes = antes[campo];
    const valorDespues = despues[campo];

    // Comparar arrays (tags)
    if (Array.isArray(valorAntes) && Array.isArray(valorDespues)) {
      if (JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)) {
        diffs.push({
          campo,
          antes: valorAntes as string[],
          despues: valorDespues as string[],
        });
      }
      continue;
    }

    // Comparar valores primitivos
    if (valorAntes !== valorDespues) {
      diffs.push({
        campo,
        antes: (valorAntes as string | number) ?? null,
        despues: (valorDespues as string | number) ?? null,
      });
    }
  }

  return diffs;
}

// Crear un evento de auditoría
export function crearEventoAuditoria(
  accion: AuditAction,
  taskId: string,
  taskTitulo: string,
  diff: FieldDiff[]
): AuditEvent {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    accion,
    taskId,
    taskTitulo,
    diff,
    userLabel: USER_LABEL,
  };
}

// Crear evento para cuando se crea una tarea nueva
export function auditCrear(task: Task): AuditEvent {
  const diff: FieldDiff[] = [
    { campo: "titulo", antes: null, despues: task.titulo },
    { campo: "prioridad", antes: null, despues: task.prioridad },
    { campo: "estado", antes: null, despues: task.estado },
    { campo: "estimacionMin", antes: null, despues: task.estimacionMin },
  ];
  if (task.tags.length > 0) {
    diff.push({ campo: "tags", antes: null, despues: task.tags });
  }
  if (task.fechaLimite) {
    diff.push({ campo: "fechaLimite", antes: null, despues: task.fechaLimite });
  }
  return crearEventoAuditoria("CREATE", task.id, task.titulo, diff);
}

// Crear evento para cuando se edita una tarea
export function auditEditar(antes: Task, despues: Task): AuditEvent {
  const diff = calcularDiff(antes, despues);
  return crearEventoAuditoria("UPDATE", despues.id, despues.titulo, diff);
}

// Crear evento para cuando se mueve una tarea entre columnas
export function auditMover(task: Task, estadoAnterior: string, estadoNuevo: string): AuditEvent {
  const diff: FieldDiff[] = [
    { campo: "estado", antes: estadoAnterior, despues: estadoNuevo },
  ];
  return crearEventoAuditoria("MOVE", task.id, task.titulo, diff);
}

// Crear evento para cuando se elimina una tarea
export function auditEliminar(task: Task): AuditEvent {
  const diff: FieldDiff[] = [
    { campo: "titulo", antes: task.titulo, despues: null },
    { campo: "estado", antes: task.estado, despues: null },
    { campo: "prioridad", antes: task.prioridad, despues: null },
  ];
  return crearEventoAuditoria("DELETE", task.id, task.titulo, diff);
}

// Formatear un diff para mostrar de forma legible
export function formatearDiff(diff: FieldDiff): string {
  const formatVal = (val: string | number | string[] | null): string => {
    if (val === null) return "∅";
    if (Array.isArray(val)) return `[${val.join(", ")}]`;
    return String(val);
  };

  return `${diff.campo}: ${formatVal(diff.antes)} → ${formatVal(diff.despues)}`;
}

// Generar un resumen de texto de los eventos de auditoría (para copiar)
export function generarResumenAuditoria(eventos: AuditEvent[]): string {
  const lineas = [
    "═══════════════════════════════════════",
    "  REPORTE DE AUDITORÍA - Micro Trello",
    `  Generado: ${new Date().toLocaleString("es-ES")}`,
    `  Total de eventos: ${eventos.length}`,
    "═══════════════════════════════════════",
    "",
  ];

  // Resumen por tipo de acción
  const conteo = { CREATE: 0, UPDATE: 0, DELETE: 0, MOVE: 0 };
  for (const e of eventos) {
    conteo[e.accion]++;
  }
  lineas.push("Resumen:");
  lineas.push(`  Creaciones: ${conteo.CREATE}`);
  lineas.push(`  Ediciones:  ${conteo.UPDATE}`);
  lineas.push(`  Movimientos: ${conteo.MOVE}`);
  lineas.push(`  Eliminaciones: ${conteo.DELETE}`);
  lineas.push("");
  lineas.push("───────────────────────────────────────");
  lineas.push("");

  // Detalle de cada evento
  for (const evento of eventos) {
    const fecha = new Date(evento.timestamp).toLocaleString("es-ES");
    lineas.push(`[${fecha}] ${evento.accion} - "${evento.taskTitulo}"`);
    lineas.push(`  Usuario: ${evento.userLabel} | Task ID: ${evento.taskId.slice(0, 8)}...`);
    for (const d of evento.diff) {
      lineas.push(`  • ${formatearDiff(d)}`);
    }
    lineas.push("");
  }

  return lineas.join("\n");
}
