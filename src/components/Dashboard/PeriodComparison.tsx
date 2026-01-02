import { useMemo } from "react";
import { Atendimento, calcularMetricas } from "@/hooks/useAtendimentos";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PeriodComparisonProps {
  data: Atendimento[];
  currentStart: Date;
  currentEnd: Date;
}

export function PeriodComparison({ data, currentStart, currentEnd }: PeriodComparisonProps) {
  const comparison = useMemo(() => {
    // Calculate period duration in days
    const periodDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Previous period
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - periodDays);

    const currentMetrics = calcularMetricas(data, currentStart, currentEnd);
    const previousMetrics = calcularMetricas(data, previousStart, previousEnd);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      receita: {
        current: currentMetrics.receita,
        previous: previousMetrics.receita,
        change: calculateChange(currentMetrics.receita, previousMetrics.receita),
      },
      vendas: {
        current: currentMetrics.vendas,
        previous: previousMetrics.vendas,
        change: calculateChange(currentMetrics.vendas, previousMetrics.vendas),
      },
      atendimentos: {
        current: currentMetrics.totalAtendimentos,
        previous: previousMetrics.totalAtendimentos,
        change: calculateChange(currentMetrics.totalAtendimentos, previousMetrics.totalAtendimentos),
      },
      conversao: {
        current: currentMetrics.taxaConversao,
        previous: previousMetrics.taxaConversao,
        change: currentMetrics.taxaConversao - previousMetrics.taxaConversao,
      },
      ticketMedio: {
        current: currentMetrics.ticketMedio,
        previous: previousMetrics.ticketMedio,
        change: calculateChange(currentMetrics.ticketMedio, previousMetrics.ticketMedio),
      },
    };
  }, [data, currentStart, currentEnd]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const TrendIcon = ({ change }: { change: number }) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-success";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const metrics: Array<{
    label: string;
    current: number;
    previous: number;
    change: number;
    format: (v: number) => string;
    isPercentage?: boolean;
  }> = [
    { label: "Receita", ...comparison.receita, format: formatCurrency },
    { label: "Vendas", ...comparison.vendas, format: (v: number) => v.toString() },
    { label: "Atendimentos", ...comparison.atendimentos, format: (v: number) => v.toString() },
    { label: "Conversão", ...comparison.conversao, format: (v: number) => `${v.toFixed(1)}%`, isPercentage: true },
    { label: "Ticket Médio", ...comparison.ticketMedio, format: formatCurrency },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Comparativo com o período anterior
      </p>
      
      <div className="grid gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3"
          >
            <div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {metric.format(metric.current)}
                </span>
                <span className="text-xs text-muted-foreground">
                  vs {metric.format(metric.previous)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon change={metric.change} />
              <span className={`text-sm font-medium ${getTrendColor(metric.change)}`}>
                {metric.change > 0 ? "+" : ""}
                {metric.isPercentage ? metric.change.toFixed(1) : metric.change.toFixed(0)}
                {metric.isPercentage ? " p.p." : "%"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
