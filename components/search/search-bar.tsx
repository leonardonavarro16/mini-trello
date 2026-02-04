"use client";

import { Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SEARCH_EXAMPLES } from "@/lib/query";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar tareas..."
          className="pl-10"
          aria-label="Buscar tareas con operadores avanzados"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Ayuda de búsqueda: ver operadores disponibles"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px]" align="end">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Operadores de búsqueda</h4>
            <p className="text-xs text-muted-foreground">
              Puedes combinar texto libre con operadores para filtrar tareas de forma precisa.
            </p>
            <div className="space-y-2">
              {SEARCH_EXAMPLES.map((ejemplo) => (
                <button
                  key={ejemplo.query}
                  className="flex items-start gap-2 w-full text-left rounded-md p-2 hover:bg-muted transition-colors"
                  onClick={() => onChange(ejemplo.query)}
                  aria-label={`Usar ejemplo: ${ejemplo.query}`}
                >
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                    {ejemplo.query}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {ejemplo.descripcion}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
