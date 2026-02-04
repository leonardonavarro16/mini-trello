"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Download, Moon, Sun, Upload, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { DeleteDialog } from "@/components/kanban/delete-dialog";
import { ImportDialog } from "@/components/kanban/import-dialog";
import { AuditLog } from "@/components/audit/audit-log";
import { SearchBar } from "@/components/search/search-bar";
import { GodModePanel } from "@/components/god-mode/god-mode-panel";
import { loadBoard, saveBoard, exportBoardJSON, importBoardJSON } from "@/lib/storage";
import { filterTasks } from "@/lib/query";
import { auditCrear, auditEditar, auditMover, auditEliminar, crearEventoAuditoria } from "@/lib/audit";
import {
  BoardState,
  GodModeEval,
  INITIAL_BOARD_STATE,
  Task,
  TaskStatus,
} from "@/types";
import { TaskFormValues } from "@/lib/validations";

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD_STATE);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado de dialogs
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultEstado, setDefaultEstado] = useState<TaskStatus>("todo");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Marcar como montado (para evitar hydration mismatch con el tema)
  useEffect(() => setMounted(true), []);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const saved = loadBoard();
    setBoard(saved);
    setLoaded(true);
  }, []);

  // Persistir cada cambio en localStorage
  const persistBoard = useCallback((newBoard: BoardState) => {
    setBoard(newBoard);
    saveBoard(newBoard);
  }, []);

  // === OPERACIONES CON TAREAS ===

  function handleAddTask(estado: TaskStatus) {
    setEditingTask(null);
    setDefaultEstado(estado);
    setTaskDialogOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setTaskDialogOpen(true);
  }

  function handleDeleteTask(task: Task) {
    setDeletingTask(task);
    setDeleteDialogOpen(true);
  }

  function handleSaveTask(data: TaskFormValues, estado: TaskStatus) {
    const tags = data.tags
      ? data.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    if (editingTask) {
      // EDITAR tarea existente
      const updatedTask: Task = {
        ...editingTask,
        titulo: data.titulo,
        descripcion: data.descripcion ?? "",
        prioridad: data.prioridad,
        tags,
        estimacionMin: data.estimacionMin,
        fechaLimite: data.fechaLimite
          ? new Date(data.fechaLimite).toISOString()
          : "",
      };

      const evento = auditEditar(editingTask, updatedTask);
      const newTasks = board.tasks.map((t) =>
        t.id === editingTask.id ? updatedTask : t
      );

      persistBoard({
        ...board,
        tasks: newTasks,
        auditLog: [evento, ...board.auditLog],
      });

      toast.success("Tarea actualizada");
    } else {
      // CREAR nueva tarea
      const newTask: Task = {
        id: uuidv4(),
        titulo: data.titulo,
        descripcion: data.descripcion ?? "",
        prioridad: data.prioridad,
        tags,
        estimacionMin: data.estimacionMin,
        fechaCreacion: new Date().toISOString(),
        fechaLimite: data.fechaLimite
          ? new Date(data.fechaLimite).toISOString()
          : "",
        estado,
      };

      const evento = auditCrear(newTask);

      persistBoard({
        ...board,
        tasks: [...board.tasks, newTask],
        auditLog: [evento, ...board.auditLog],
      });

      toast.success("Tarea creada");
    }
  }

  function handleConfirmDelete() {
    if (!deletingTask) return;

    const evento = auditEliminar(deletingTask);
    const newTasks = board.tasks.filter((t) => t.id !== deletingTask.id);
    // También eliminar evaluación si existe
    const newEvals = board.godModeEvals.filter(
      (ev) => ev.taskId !== deletingTask.id
    );

    persistBoard({
      ...board,
      tasks: newTasks,
      auditLog: [evento, ...board.auditLog],
      godModeEvals: newEvals,
    });

    setDeleteDialogOpen(false);
    setDeletingTask(null);
    toast.success("Tarea eliminada");
  }

  function handleMoveTask(taskId: string, newStatus: TaskStatus) {
    const task = board.tasks.find((t) => t.id === taskId);
    if (!task || task.estado === newStatus) return;

    const estadoAnterior = task.estado;
    const updatedTask = { ...task, estado: newStatus };
    const evento = auditMover(updatedTask, estadoAnterior, newStatus);
    const newTasks = board.tasks.map((t) =>
      t.id === taskId ? updatedTask : t
    );

    persistBoard({
      ...board,
      tasks: newTasks,
      auditLog: [evento, ...board.auditLog],
    });
  }

  // === EXPORT / IMPORT ===

  function handleExport() {
    exportBoardJSON(board);
    toast.success("Tablero exportado como JSON");
  }

  function handleImport(jsonString: string) {
    const result = importBoardJSON(jsonString, board.tasks);

    if (result.success && result.board) {
      const auditEvents = [...board.auditLog];

      // Registrar en auditoría si se regeneraron IDs
      if (result.idsRegenerados > 0) {
        const evento = crearEventoAuditoria(
          "CREATE",
          "import",
          `Importación (${result.idsRegenerados} IDs regenerados)`,
          [
            {
              campo: "import",
              antes: null,
              despues: `${result.board.tasks.length} tareas importadas`,
            },
          ]
        );
        auditEvents.unshift(evento);
      }

      persistBoard({
        tasks: [...board.tasks, ...result.board.tasks],
        auditLog: [...auditEvents, ...result.board.auditLog],
        godModeEvals: [
          ...board.godModeEvals,
          ...result.board.godModeEvals,
        ],
        godModeEnabled: board.godModeEnabled,
      });

      toast.success("Tablero importado correctamente");
    }

    return result;
  }

  // === MODO DIOS ===

  function toggleGodMode() {
    persistBoard({
      ...board,
      godModeEnabled: !board.godModeEnabled,
    });
  }

  function handleSaveEval(eval_: GodModeEval) {
    const existing = board.godModeEvals.findIndex(
      (ev) => ev.taskId === eval_.taskId
    );
    const newEvals =
      existing >= 0
        ? board.godModeEvals.map((ev, i) => (i === existing ? eval_ : ev))
        : [...board.godModeEvals, eval_];

    persistBoard({ ...board, godModeEvals: newEvals });
    toast.success("Evaluación guardada");
  }

  // Filtrar tareas por búsqueda
  const filteredTasks = filterTasks(board.tasks, searchQuery);

  // No renderizar hasta que se cargue de localStorage (evita hydration mismatch)
  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando tablero...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold tracking-tight">
                Taskify
              </h1>
              <p className="text-xl text-muted-foreground">
                Gestor de tareas 
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Switch Modo Oscuro / Claro */}
              <div className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                <Switch
                  id="theme-toggle"
                  checked={mounted && resolvedTheme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                  aria-label="Alternar modo oscuro"
                  size="sm"
                />
                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              {/* Switch Modo Dios */}
              <div className="flex items-center gap-2">
                <Switch
                  id="god-mode"
                  checked={board.godModeEnabled}
                  onCheckedChange={toggleGodMode}
                  aria-label="Activar Modo Dios"
                />
                <Label
                  htmlFor="god-mode"
                  className="text-sm cursor-pointer flex items-center gap-1"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Modo Dios
                </Label>
              </div>

              {/* Export / Import */}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-1" />
                Importar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="kanban" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="kanban">Tablero</TabsTrigger>
              <TabsTrigger value="audit">
                Auditoría ({board.auditLog.length})
              </TabsTrigger>
              {board.godModeEnabled && (
                <TabsTrigger value="god-mode">
                  Modo Dios
                </TabsTrigger>
              )}
            </TabsList>

            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Tab: Kanban Board */}
          <TabsContent value="kanban" className="mt-4">
            {searchQuery && filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">
                  Sin resultados para &quot;{searchQuery}&quot;
                </p>
                <p className="text-sm mt-1">
                  Prueba con otros términos o usa los operadores de búsqueda.
                </p>
              </div>
            ) : (
              <KanbanBoard
                tasks={searchQuery ? filteredTasks : board.tasks}
                onMoveTask={handleMoveTask}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </TabsContent>

          {/* Tab: Audit Log */}
          <TabsContent value="audit" className="mt-4">
            <AuditLog eventos={board.auditLog} />
          </TabsContent>

          {/* Tab: God Mode */}
          {board.godModeEnabled && (
            <TabsContent value="god-mode" className="mt-4">
              <GodModePanel
                tasks={board.tasks}
                evaluaciones={board.godModeEvals}
                onSaveEval={handleSaveEval}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        defaultEstado={defaultEstado}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        task={deletingTask}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setDeletingTask(null);
        }}
      />

      <ImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
