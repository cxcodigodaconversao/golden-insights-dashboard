import { useMemo } from "react";
import { Atendimento } from "@/hooks/useAtendimentos";

interface ConversionFunnelProps {
  data: Atendimento[];
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const funnelData = useMemo(() => {
    const total = data.length;
    const compareceram = data.filter((a) => !a.status.includes("Não compareceu")).length;
    const emNegociacao = data.filter((a) => 
      a.status === "Em negociação" || 
      a.status === "Pagamento agendado"
    ).length;
    const vendas = data.filter(
      (a) => a.status.includes("Venda") && !a.status.includes("Reembolsada")
    ).length;

    return [
      { label: "Agendados", value: total, color: "bg-primary" },
      { label: "Compareceram", value: compareceram, color: "bg-success" },
      { label: "Em Negociação", value: emNegociacao, color: "bg-warning" },
      { label: "Vendas", value: vendas, color: "bg-success" },
    ];
  }, [data]);

  const maxValue = Math.max(...funnelData.map((d) => d.value), 1);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">Sem dados para exibir o funil</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {funnelData.map((step, index) => {
        const width = (step.value / maxValue) * 100;
        // Para Vendas (index 3), usar Compareceram (index 1) como base, não Em Negociação
        const baseValue = index === 3 ? funnelData[1].value : (index > 0 ? funnelData[index - 1].value : step.value);
        const conversionRate = baseValue > 0 ? ((step.value / baseValue) * 100).toFixed(1) : "0";

        return (
          <div key={step.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{step.value}</span>
                {index > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({conversionRate}%)
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-8 w-full overflow-hidden rounded-lg bg-secondary">
              <div
                className={`absolute inset-y-0 left-0 ${step.color} transition-all duration-500 ease-out`}
                style={{ 
                  width: `${width}%`,
                  clipPath: index === funnelData.length - 1 
                    ? 'none' 
                    : 'polygon(0 0, 100% 0, 97% 100%, 0 100%)'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-foreground drop-shadow-sm">
                  {width.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Overall conversion rate */}
      <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">Taxa de Conversão Total</p>
        <p className="text-2xl font-bold text-primary">
          {funnelData[0].value > 0 
            ? ((funnelData[3].value / funnelData[0].value) * 100).toFixed(1)
            : 0}%
        </p>
        <p className="text-xs text-muted-foreground">
          De agendados para vendas
        </p>
      </div>
    </div>
  );
}
