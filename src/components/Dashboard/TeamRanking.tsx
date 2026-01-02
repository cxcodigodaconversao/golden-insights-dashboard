import { useMemo } from "react";
import { Atendimento } from "@/hooks/useAtendimentos";
import { Trophy, Shield } from "lucide-react";

interface Time {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
}

interface Closer {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
}

interface TeamStats {
  id: string;
  nome: string;
  cor: string;
  vendas: number;
  receita: number;
  atendimentos: number;
  taxaConversao: number;
}

interface TeamRankingProps {
  data: Atendimento[];
  times: Time[];
  closers: Closer[];
}

export function TeamRanking({ data, times, closers }: TeamRankingProps) {
  const ranking = useMemo(() => {
    const teamMap: Record<string, TeamStats> = {};

    // Inicializa todos os times ativos
    times.filter(t => t.ativo).forEach((time) => {
      teamMap[time.id] = {
        id: time.id,
        nome: time.nome,
        cor: time.cor,
        vendas: 0,
        receita: 0,
        atendimentos: 0,
        taxaConversao: 0,
      };
    });

    // Cria mapa de closer -> time_id
    const closerTimeMap: Record<string, string | null> = {};
    closers.forEach((closer) => {
      closerTimeMap[closer.nome] = closer.time_id;
    });

    // Processa atendimentos
    data.forEach((atendimento) => {
      const timeId = closerTimeMap[atendimento.closer];
      if (timeId && teamMap[timeId]) {
        teamMap[timeId].atendimentos++;
        
        const isVenda = atendimento.status.includes("Venda") && !atendimento.status.includes("Reembolsada");
        const compareceu = !atendimento.status.includes("Não compareceu");
        
        if (isVenda) {
          teamMap[timeId].vendas++;
          teamMap[timeId].receita += atendimento.valor || 0;
        }
      }
    });

    // Calcula taxa de conversão e ordena
    return Object.values(teamMap)
      .map((team) => ({
        ...team,
        taxaConversao: team.atendimentos > 0 
          ? (team.vendas / team.atendimentos) * 100 
          : 0,
      }))
      .sort((a, b) => b.receita - a.receita);
  }, [data, times, closers]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Shield className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum time encontrado</p>
        <p className="text-xs text-muted-foreground mt-1">
          Cadastre times e associe closers a eles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ranking.map((team, index) => (
        <div
          key={team.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
          style={{ borderLeftWidth: '4px', borderLeftColor: team.cor }}
        >
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{ 
              backgroundColor: `${team.cor}30`,
              color: team.cor
            }}
          >
            {index === 0 ? (
              <Trophy className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: team.cor }}
              />
              <p className="font-medium text-foreground truncate">{team.nome}</p>
              {index === 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Líder
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{team.atendimentos} atendimentos</span>
              <span>{team.taxaConversao.toFixed(0)}% conversão</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold" style={{ color: team.cor }}>
              {team.vendas} vendas
            </p>
            <p className="text-xs text-muted-foreground">{formatCurrency(team.receita)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
