import { Trophy, TrendingUp, Users } from "lucide-react";
import { CloserStats } from "@/hooks/useAtendimentos";
import { cn } from "@/lib/utils";

interface CloserRankingProps {
  data: CloserStats[];
}

export function CloserRanking({ data }: CloserRankingProps) {
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

  return (
    <div className="space-y-4">
      {data.map((closer, index) => (
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
              <p className="text-sm text-muted-foreground">
                {closer.vendas} vendas • {closer.percentualFechamento.toFixed(1)}% conversão
              </p>
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
      ))}
      
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <TrendingUp className="mb-2 h-8 w-8" />
          <p>Nenhum dado para o período selecionado</p>
        </div>
      )}
    </div>
  );
}
