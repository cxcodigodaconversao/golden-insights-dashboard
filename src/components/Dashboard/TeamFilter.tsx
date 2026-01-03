import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";

interface Time {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

interface TeamFilterProps {
  times: Time[];
  selectedTeam: string | null;
  onTeamChange: (teamId: string | null) => void;
}

export function TeamFilter({ times, selectedTeam, onTeamChange }: TeamFilterProps) {
  const activeTeams = times.filter(t => t.ativo);

  if (activeTeams.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedTeam || "all"}
        onValueChange={(value) => onTeamChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder="Filtrar por time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os times</SelectItem>
          {activeTeams.map((time) => (
            <SelectItem key={time.id} value={time.id}>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: time.cor || '#d2bc8f' }}
                />
                {time.nome}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
