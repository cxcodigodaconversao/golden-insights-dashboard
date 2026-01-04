import { useMemo } from "react";
import { Atendimento } from "@/hooks/useAtendimentos";
import { Users } from "lucide-react";
import { MetasProgressBar } from "./MetasProgressBar";
import { useMetas } from "@/hooks/useMetas";
import { format, startOfMonth } from "date-fns";

interface Time {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

interface SDR {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
}

interface SDRStats {
  nome: string;
  agendamentos: number;
  compareceram: number;
  vendas: number;
  receita: number;
  taxaComparecimento: number;
}

interface SDRRankingProps {
  data: Atendimento[];
  sdrsList: string[];
  times?: Time[];
  sdrs?: SDR[];
}

export function SDRRanking({ data, sdrsList, times = [], sdrs = [] }: SDRRankingProps) {
  const currentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const { data: metas = [] } = useMetas(currentMonth);

  const ranking = useMemo(() => {
    const sdrMap: Record<string, SDRStats> = {};

    sdrsList.forEach((sdr) => {
      const sdrData = data.filter((a) => a.sdr === sdr);
      const compareceram = sdrData.filter((a) => !a.status.includes("Não compareceu")).length;
      const vendas = sdrData.filter(
        (a) => a.status.includes("Venda") && !a.status.includes("Reembolsada")
      );
      const receita = vendas.reduce((acc, v) => acc + (v.valor || 0), 0);

      sdrMap[sdr] = {
        nome: sdr,
        agendamentos: sdrData.length,
        compareceram,
        vendas: vendas.length,
        receita,
        taxaComparecimento: sdrData.length > 0 ? (compareceram / sdrData.length) * 100 : 0,
      };
    });

    return Object.values(sdrMap).sort((a, b) => b.agendamentos - a.agendamentos);
  }, [data, sdrsList]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTeamForSDR = (sdrNome: string) => {
    const sdr = sdrs.find(s => s.nome === sdrNome);
    if (!sdr?.time_id) return null;
    return times.find(t => t.id === sdr.time_id);
  };

  const getSdrId = (sdrNome: string) => {
    return sdrs.find(s => s.nome === sdrNome)?.id;
  };

  const getMetaForSDR = (sdrId: string | undefined) => {
    if (!sdrId) return null;
    return metas.find(m => m.tipo === "sdr" && m.referencia_id === sdrId);
  };

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum SDR encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ranking.map((sdr, index) => {
        const team = getTeamForSDR(sdr.nome);
        const sdrId = getSdrId(sdr.nome);
        const meta = getMetaForSDR(sdrId);
        
        return (
          <div
            key={sdr.nome}
            className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/50 p-2 sm:p-3 transition-colors hover:bg-secondary overflow-hidden"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm truncate">{sdr.nome}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {team && (
                      <span 
                        className="inline-flex items-center rounded px-1 py-0.5 text-xs font-medium shrink-0"
                        style={{ 
                          backgroundColor: `${team.cor}20`, 
                          color: team.cor || 'hsl(var(--muted-foreground))' 
                        }}
                      >
                        {team.nome}
                      </span>
                    )}
                    <span>{sdr.agendamentos} agend.</span>
                    <span>{sdr.taxaComparecimento.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pl-9 sm:pl-0 sm:flex-col sm:items-end gap-0.5">
                <p className="font-semibold text-primary text-sm">{sdr.vendas} vendas</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(sdr.receita)}</p>
              </div>
            </div>

            {meta && (meta.meta_agendamentos > 0 || meta.meta_vendas > 0) && (
              <div className="grid gap-2 pt-2 border-t border-border/50 grid-cols-1 sm:grid-cols-2">
                {meta.meta_agendamentos > 0 && (
                  <MetasProgressBar
                    atual={sdr.agendamentos}
                    meta={meta.meta_agendamentos}
                    label="Meta Agend."
                  />
                )}
                {meta.meta_vendas > 0 && (
                  <MetasProgressBar
                    atual={sdr.vendas}
                    meta={meta.meta_vendas}
                    label="Meta Vendas"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
