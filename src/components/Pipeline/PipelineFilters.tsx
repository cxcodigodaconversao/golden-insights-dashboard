import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { TEMPERATURAS } from "@/hooks/usePipeline";

interface PipelineFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  temperatura: string | null;
  onTemperaturaChange: (value: string | null) => void;
  strResponsavel: string | null;
  onStrResponsavelChange: (value: string | null) => void;
  strs: { id: string; nome: string }[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function PipelineFilters({
  search,
  onSearchChange,
  temperatura,
  onTemperaturaChange,
  strResponsavel,
  onStrResponsavelChange,
  strs,
  onClearFilters,
  hasActiveFilters,
}: PipelineFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/30 rounded-lg">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou WhatsApp..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Temperatura */}
      <Select
        value={temperatura || "all"}
        onValueChange={(v) => onTemperaturaChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Temperatura" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {TEMPERATURAS.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.emoji} {t.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* SDR Responsável */}
      <Select
        value={strResponsavel || "all"}
        onValueChange={(v) => onStrResponsavelChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="SDR Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos SDRs</SelectItem>
          {strs.map((sdr) => (
            <SelectItem key={sdr.id} value={sdr.id}>
              {sdr.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Limpar Filtros */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
