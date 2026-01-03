import { Trophy, TrendingUp, Users } from "lucide-react";
import { CloserStats } from "@/hooks/useAtendimentos";
import { cn } from "@/lib/utils";
import { MetasProgressBar } from "./MetasProgressBar";
import { useMetas } from "@/hooks/useMetas";
import { format, startOfMonth } from "date-fns";

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
  const currentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const { data: metas = [] } = useMetas(currentMonth);

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

  const getCloserId = (closerNome: string) => {
    return closers.find(c => c.nome === closerNome)?.id;
  };

  const getMetaForCloser = (closerId: string | undefined) => {
    if (!closerId) return null;
    return metas.find(m => m.tipo === "closer" && m.referencia_id === closerId);
  };

  return (
    <div className="space-y-4">
      {data.map((closer, index) => {
        const team = getTeamForCloser(closer.nome);
        const closerId = getCloserId(closer.nome);
        const meta = getMetaForCloser(closerId);
        
        return (
          <div
            key={closer.nome}
            className={cn(
              "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30",
              index === 0 && "border-primary/30 glow-gold"
            )}
          >
            <div className="flex items-center justify-between">
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

            {meta && (meta.meta_vendas > 0 || meta.meta_receita > 0) && (
              <div className="grid gap-2 pt-2 border-t border-border/50 md:grid-cols-2">
                {meta.meta_vendas > 0 && (
                  <MetasProgressBar
                    atual={closer.vendas}
                    meta={meta.meta_vendas}
                    label="Meta Vendas"
                  />
                )}
                {meta.meta_receita > 0 && (
                  <MetasProgressBar
                    atual={closer.receita}
                    meta={meta.meta_receita}
                    label="Meta Receita"
                    formatValue={formatCurrency}
                  />
                )}
              </div>
            )}
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
