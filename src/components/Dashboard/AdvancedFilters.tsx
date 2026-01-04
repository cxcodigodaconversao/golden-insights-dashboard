import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Headphones, Shield } from "lucide-react";

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

interface AdvancedFiltersProps {
  times: Time[];
  closers: Closer[];
  sdrs: SDR[];
  selectedTeam: string | null;
  selectedCloser: string | null;
  selectedSdr: string | null;
  onTeamChange: (teamId: string | null) => void;
  onCloserChange: (closerId: string | null) => void;
  onSdrChange: (sdrId: string | null) => void;
  showCloserFilter?: boolean;
  showSdrFilter?: boolean;
}

export function AdvancedFilters({
  times,
  closers,
  sdrs,
  selectedTeam,
  selectedCloser,
  selectedSdr,
  onTeamChange,
  onCloserChange,
  onSdrChange,
  showCloserFilter = true,
  showSdrFilter = true,
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
    </div>
  );
}
