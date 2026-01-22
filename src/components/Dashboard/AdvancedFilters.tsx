import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Headphones, Shield, Building2, Globe, CreditCard } from "lucide-react";
import { TIPOS_NEGOCIACAO } from "@/hooks/usePipeline";

interface Time {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

interface Closer {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
}

interface SDR {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
}

interface Cliente {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Origem {
  id: string;
  nome: string;
  ativo: boolean;
}

interface AdvancedFiltersProps {
  times: Time[];
  closers: Closer[];
  sdrs: SDR[];
  clientes?: Cliente[];
  origens?: Origem[];
  selectedTeam: string | null;
  selectedCloser: string | null;
  selectedSdr: string | null;
  selectedCliente?: string | null;
  selectedOrigem?: string | null;
  selectedTipoNegociacao?: string | null;
  onTeamChange: (teamId: string | null) => void;
  onCloserChange: (closerId: string | null) => void;
  onSdrChange: (sdrId: string | null) => void;
  onClienteChange?: (clienteId: string | null) => void;
  onOrigemChange?: (origemId: string | null) => void;
  onTipoNegociacaoChange?: (tipo: string | null) => void;
  showCloserFilter?: boolean;
  showSdrFilter?: boolean;
  showClienteFilter?: boolean;
  showOrigemFilter?: boolean;
  showTipoNegociacaoFilter?: boolean;
}

export function AdvancedFilters({
  times,
  closers,
  sdrs,
  clientes = [],
  origens = [],
  selectedTeam,
  selectedCloser,
  selectedSdr,
  selectedCliente,
  selectedOrigem,
  selectedTipoNegociacao,
  onTeamChange,
  onCloserChange,
  onSdrChange,
  onClienteChange,
  onOrigemChange,
  onTipoNegociacaoChange,
  showCloserFilter = true,
  showSdrFilter = true,
  showClienteFilter = true,
  showOrigemFilter = true,
  showTipoNegociacaoFilter = false,
}: AdvancedFiltersProps) {
  // Filter closers and SDRs by selected team
  const filteredClosers = useMemo(() => {
    if (!selectedTeam) return closers.filter(c => c.ativo);
    return closers.filter(c => c.ativo && c.time_id === selectedTeam);
  }, [closers, selectedTeam]);

  const filteredSdrs = useMemo(() => {
    if (!selectedTeam) return sdrs.filter(s => s.ativo);
    return sdrs.filter(s => s.ativo && s.time_id === selectedTeam);
  }, [sdrs, selectedTeam]);

  const handleTeamChange = (value: string) => {
    const teamId = value === "all" ? null : value;
    onTeamChange(teamId);
    // Reset closer/sdr when team changes
    onCloserChange(null);
    onSdrChange(null);
  };

  const handleCloserChange = (value: string) => {
    onCloserChange(value === "all" ? null : value);
  };

  const handleSdrChange = (value: string) => {
    onSdrChange(value === "all" ? null : value);
  };

  const handleClienteChange = (value: string) => {
    onClienteChange?.(value === "all" ? null : value);
  };

  const handleOrigemChange = (value: string) => {
    onOrigemChange?.(value === "all" ? null : value);
  };

  const handleTipoNegociacaoChange = (value: string) => {
    onTipoNegociacaoChange?.(value === "all" ? null : value);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Team Filter */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Time
        </Label>
        <Select value={selectedTeam || "all"} onValueChange={handleTeamChange}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Times</SelectItem>
            {times.filter(t => t.ativo).map(time => (
              <SelectItem key={time.id} value={time.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: time.cor || '#d2bc8f' }}
                  />
                  {time.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Closer Filter */}
      {showCloserFilter && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Closer
          </Label>
          <Select value={selectedCloser || "all"} onValueChange={handleCloserChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Closers</SelectItem>
              {filteredClosers.map(closer => (
                <SelectItem key={closer.id} value={closer.id}>
                  {closer.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* SDR Filter */}
      {showSdrFilter && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Headphones className="h-3 w-3" />
            SDR
          </Label>
          <Select value={selectedSdr || "all"} onValueChange={handleSdrChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos SDRs</SelectItem>
              {filteredSdrs.map(sdr => (
                <SelectItem key={sdr.id} value={sdr.id}>
                  {sdr.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cliente Filter */}
      {showClienteFilter && clientes.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Cliente
          </Label>
          <Select value={selectedCliente || "all"} onValueChange={handleClienteChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Clientes</SelectItem>
              {clientes.filter(c => c.ativo).map(cliente => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Origem Filter */}
      {showOrigemFilter && origens.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Origem
          </Label>
          <Select value={selectedOrigem || "all"} onValueChange={handleOrigemChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Origens</SelectItem>
              {origens.filter(o => o.ativo).map(origem => (
                <SelectItem key={origem.id} value={origem.id}>
                  {origem.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tipo de Negociação Filter */}
      {showTipoNegociacaoFilter && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Tipo Negociação
          </Label>
          <Select value={selectedTipoNegociacao || "all"} onValueChange={handleTipoNegociacaoChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              {TIPOS_NEGOCIACAO.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
