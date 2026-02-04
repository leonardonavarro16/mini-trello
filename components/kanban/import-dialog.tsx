"use client";

import { useRef, useState } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImportResult, ImportValidationError } from "@/lib/storage";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (jsonString: string) => ImportResult;
}

export function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<ImportValidationError[]>([]);
  const [successMsg, setSuccessMsg] = useState<string>("");

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = onImport(content);

      if (!result.success) {
        setErrors(result.errors);
      } else {
        let msg = "Importación completada correctamente.";
        if (result.idsRegenerados > 0) {
          msg += ` Se regeneraron ${result.idsRegenerados} IDs duplicados.`;
        }
        setSuccessMsg(msg);
        setTimeout(() => {
          onClose();
          setSuccessMsg("");
        }, 2000);
      }
    };
    reader.readAsText(file);

    // Reset para permitir seleccionar el mismo archivo de nuevo
    event.target.value = "";
  }

  function handleClose() {
    setErrors([]);
    setSuccessMsg("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar tablero</DialogTitle>
          <DialogDescription>
            Selecciona un archivo JSON exportado previamente. Se validarán todos
            los campos antes de importar. Los IDs duplicados se regenerarán
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelect}
            aria-label="Seleccionar archivo JSON para importar"
          />

          <Button
            variant="outline"
            className="w-full h-24 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span>Seleccionar archivo JSON</span>
            </div>
          </Button>

          {/* Errores de validación */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <p className="font-semibold text-sm">
                  No se puede importar. Se encontraron {errors.length} error(es):
                </p>
              </div>
              <ul className="space-y-1 max-h-[200px] overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-destructive">
                    <code className="font-mono">{err.campo}</code>: {err.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mensaje de éxito */}
          {successMsg && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                {successMsg}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
