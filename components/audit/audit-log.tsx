"use client";

import { useState } from "react";
import { Copy, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuditAction, AuditEvent } from "@/types";
import { formatearDiff, generarResumenAuditoria } from "@/lib/audit";
import { toast } from "sonner";

interface AuditLogProps {
  eventos: AuditEvent[];
}

const accionConfig: Record<AuditAction, { label: string; className: string }> = {
  CREATE: { label: "Crear", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  UPDATE: { label: "Editar", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  DELETE: { label: "Eliminar", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  MOVE: { label: "Mover", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
};

export function AuditLog({ eventos }: AuditLogProps) {
  const [filtroAccion, setFiltroAccion] = useState<string>("all");
  const [filtroTaskId, setFiltroTaskId] = useState<string>("");

  // Filtrar eventos
  const eventosFiltrados = eventos.filter((e) => {
    if (filtroAccion !== "all" && e.accion !== filtroAccion) return false;
    if (filtroTaskId && !e.taskId.includes(filtroTaskId) && !e.taskTitulo.toLowerCase().includes(filtroTaskId.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Copiar resumen al portapapeles
  async function copiarResumen() {
    const resumen = generarResumenAuditoria(eventosFiltrados);
    await navigator.clipboard.writeText(resumen);
    toast.success("Resumen copiado al portapapeles");
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroAccion} onValueChange={setFiltroAccion}>
            <SelectTrigger className="w-[150px]" aria-label="Filtrar por acción">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CREATE">Crear</SelectItem>
              <SelectItem value="UPDATE">Editar</SelectItem>
              <SelectItem value="DELETE">Eliminar</SelectItem>
              <SelectItem value="MOVE">Mover</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Filtrar por ID o título de tarea..."
          value={filtroTaskId}
          onChange={(e) => setFiltroTaskId(e.target.value)}
          className="max-w-[300px]"
          aria-label="Filtrar por ID o título de tarea"
        />

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={copiarResumen}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar resumen
          </Button>
        </div>
      </div>

      {/* Contador */}
      <p className="text-sm text-muted-foreground">
        Mostrando {eventosFiltrados.length} de {eventos.length} eventos
      </p>

      {/* Tabla */}
      {eventosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Sin eventos de auditoría</p>
          <p className="text-sm mt-1">
            {eventos.length === 0
              ? "Los eventos aparecerán aquí cuando crees, edites o muevas tareas."
              : "No hay eventos que coincidan con los filtros aplicados."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Fecha</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
                <TableHead className="w-[200px]">Tarea</TableHead>
                <TableHead>Cambios </TableHead>
                <TableHead className="w-[100px]">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventosFiltrados.map((evento) => {
                const config = accionConfig[evento.accion];
                return (
                  <TableRow key={evento.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(evento.timestamp).toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.className}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">
                          {evento.taskTitulo}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {evento.taskId.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {evento.diff.map((d, i) => (
                          <p key={i} className="text-xs font-mono">
                            {formatearDiff(d)}
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{evento.userLabel}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
