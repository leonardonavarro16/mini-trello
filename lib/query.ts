import { Task } from "@/types";

// Filtro parseado de la búsqueda
interface ParsedFilter {
  textoLibre: string;
  tags: string[];
  prioridad: string | null;
  dueFilter: "overdue" | "week" | null;
  estimacionOp: { operador: "lt" | "gte"; valor: number } | null;
}

// Parsear el string de búsqueda en filtros estructurados
// Operadores soportados:
//   tag:nombre     → filtra por tag
//   p:high/medium/low → filtra por prioridad
//   due:overdue    → tareas con fecha límite pasada
//   due:week       → tareas con fecha límite esta semana
//   est:<60        → estimación menor a 60 min
//   est:>=120      → estimación mayor o igual a 120 min
export function parseQuery(query: string): ParsedFilter {
  const filter: ParsedFilter = {
    textoLibre: "",
    tags: [],
    prioridad: null,
    dueFilter: null,
    estimacionOp: null,
  };

  const textoParts: string[] = [];

  // Dividir por espacios respetando cada token
  const tokens = query.trim().split(/\s+/);

  for (const token of tokens) {
    if (!token) continue;

    // Operador tag:valor
    if (token.startsWith("tag:")) {
      const valor = token.slice(4).toLowerCase();
      if (valor) filter.tags.push(valor);
      continue;
    }

    // Operador p:valor (prioridad)
    if (token.startsWith("p:")) {
      const valor = token.slice(2).toLowerCase();
      if (["low", "medium", "high"].includes(valor)) {
        filter.prioridad = valor;
      }
      continue;
    }

    // Operador due:overdue o due:week
    if (token.startsWith("due:")) {
      const valor = token.slice(4).toLowerCase();
      if (valor === "overdue" || valor === "week") {
        filter.dueFilter = valor;
      }
      continue;
    }

    // Operador est:<N o est:>=N
    if (token.startsWith("est:")) {
      const valor = token.slice(4);
      if (valor.startsWith(">=")) {
        const num = parseInt(valor.slice(2), 10);
        if (!isNaN(num)) {
          filter.estimacionOp = { operador: "gte", valor: num };
        }
      } else if (valor.startsWith("<")) {
        const num = parseInt(valor.slice(1), 10);
        if (!isNaN(num)) {
          filter.estimacionOp = { operador: "lt", valor: num };
        }
      }
      continue;
    }

    // Si no es un operador, es texto libre
    textoParts.push(token);
  }

  filter.textoLibre = textoParts.join(" ").toLowerCase();
  return filter;
}

// Aplicar los filtros parseados a un array de tareas
export function filterTasks(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;

  const filter = parseQuery(query);

  return tasks.filter((task) => {
    // Filtro de texto libre: busca en título y descripción
    if (filter.textoLibre) {
      const titulo = task.titulo.toLowerCase();
      const descripcion = task.descripcion.toLowerCase();
      if (
        !titulo.includes(filter.textoLibre) &&
        !descripcion.includes(filter.textoLibre)
      ) {
        return false;
      }
    }

    // Filtro por tags
    if (filter.tags.length > 0) {
      const taskTags = task.tags.map((t) => t.toLowerCase());
      const tieneTag = filter.tags.some((filterTag) =>
        taskTags.some((taskTag) => taskTag.includes(filterTag))
      );
      if (!tieneTag) return false;
    }

    // Filtro por prioridad
    if (filter.prioridad && task.prioridad !== filter.prioridad) {
      return false;
    }

    // Filtro por fecha límite
    if (filter.dueFilter) {
      if (!task.fechaLimite) return false;

      const ahora = new Date();
      const fechaLimite = new Date(task.fechaLimite);

      if (filter.dueFilter === "overdue") {
        // Solo tareas cuya fecha límite ya pasó
        if (fechaLimite >= ahora) return false;
      } else if (filter.dueFilter === "week") {
        // Tareas con fecha límite dentro de esta semana (7 días)
        const enUnaSemana = new Date();
        enUnaSemana.setDate(enUnaSemana.getDate() + 7);
        if (fechaLimite < ahora || fechaLimite > enUnaSemana) return false;
      }
    }

    // Filtro por estimación
    if (filter.estimacionOp) {
      const { operador, valor } = filter.estimacionOp;
      if (operador === "lt" && task.estimacionMin >= valor) return false;
      if (operador === "gte" && task.estimacionMin < valor) return false;
    }

    return true;
  });
}

// Ejemplos de búsqueda para mostrar en la UI
export const SEARCH_EXAMPLES = [
  { query: "análisis", descripcion: "Busca 'análisis' en título o descripción" },
  { query: "tag:mercado", descripcion: "Tareas con el tag 'mercado'" },
  { query: "p:high", descripcion: "Solo tareas de prioridad alta" },
  { query: "due:overdue", descripcion: "Tareas con fecha límite vencida" },
  { query: "due:week", descripcion: "Tareas con fecha límite esta semana" },
  { query: "est:<60", descripcion: "Estimación menor a 60 minutos" },
  { query: "est:>=120", descripcion: "Estimación de 120 minutos o más" },
  { query: "p:high tag:urgente", descripcion: "Combinación de filtros" },
];
