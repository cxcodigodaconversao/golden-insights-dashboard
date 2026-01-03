import { Trophy, TrendingUp, Users } from "lucide-react";
import { CloserStats } from "@/hooks/useAtendimentos";
import { cn } from "@/lib/utils";

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

interface CloserRankingProps {
  data: CloserStats[];
  times?: Time[];
  closers?: Closer[];
}

export function CloserRanking({ data, times = [], closers = [] }: CloserRankingProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getRankingBadge = (index: number) => {
    if (index === 0) return "bg-primary text-primary-foreground";
    if (index === 1) return "bg-muted text-foreground";
    if (index === 2) return "bg-warning/20 text-warning";
    return "bg-secondary text-secondary-foreground";
  };

  const getTeamForCloser = (closerNome: string) => {
    const closer = closers.find(c => c.nome === closerNome);
    if (!closer?.time_id) return null;
    return times.find(t => t.id === closer.time_id);
  };

  return (
    <div className="space-y-4">
      {data.map((closer, index) => {
        const team = getTeamForCloser(closer.nome);
        
        return (
          <div
            key={closer.nome}
            className={cn(
              "flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30",
              index === 0 && "border-primary/30 glow-gold"
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full font-display font-bold",
                  getRankingBadge(index)
                )}
              >
                {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
              </div>
              <div>
                <p className="font-medium text-foreground">{closer.nome}</p>
                <div className="flex items-center gap-2">
                  {team && (
                    <span 
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
                      style={{ 
                        backgroundColor: `${team.cor}20`, 
                        color: team.cor || 'hsl(var(--muted-foreground))' 
                      }}
                    >
                      {team.nome}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {closer.vendas} vendas • {closer.percentualFechamento.toFixed(1)}% conversão
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-display font-bold",
                index === 0 ? "text-primary" : "text-foreground"
              )}>
                {formatCurrency(closer.receita)}
              </p>
              <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{closer.compareceram} atendimentos</span>
              </div>
            </div>
          </div>
        );
      })}
      
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <TrendingUp className="mb-2 h-8 w-8" />
          <p>Nenhum dado para o período selecionado</p>
        </div>
      )}
    </div>
  );
}
