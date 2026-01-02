import { useMemo } from "react";
import { Atendimento } from "@/hooks/useAtendimentos";
import { Users } from "lucide-react";

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
}

export function SDRRanking({ data, sdrsList }: SDRRankingProps) {
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

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum SDR encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ranking.map((sdr, index) => (
        <div
          key={sdr.nome}
          className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{sdr.nome}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{sdr.agendamentos} agendados</span>
              <span>{sdr.taxaComparecimento.toFixed(0)}% comp.</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">{sdr.vendas} vendas</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(sdr.receita)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
