import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { CreditCard } from "lucide-react";
import { TIPOS_NEGOCIACAO } from "@/hooks/usePipeline";

interface TipoNegociacaoChartProps {
  data: Array<{
    tipo_negociacao: string | null;
    valor_venda: number | null;
    etapa_atual: string;
  }>;
}

const COLORS = ["#C9A86C", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6"];

export function TipoNegociacaoChart({ data }: TipoNegociacaoChartProps) {
  const chartData = useMemo(() => {
    // Filtrar apenas vendas em aplicação ou ganho
    const vendas = data.filter(
      (a) =>
        (a.etapa_atual === "aplicacao" || a.etapa_atual === "ganho") &&
        a.tipo_negociacao
    );

    const tipoMap: Record<string, { quantidade: number; valor: number }> = {};

    vendas.forEach((v) => {
      const tipo = v.tipo_negociacao || "outros";
      if (!tipoMap[tipo]) {
        tipoMap[tipo] = { quantidade: 0, valor: 0 };
      }
      tipoMap[tipo].quantidade += 1;
      tipoMap[tipo].valor += v.valor_venda || 0;
    });

    return Object.entries(tipoMap)
      .map(([id, stats]) => {
        const tipoInfo = TIPOS_NEGOCIACAO.find((t) => t.id === id);
        return {
          name: tipoInfo?.nome || id,
          quantidade: stats.quantidade,
          valor: stats.valor,
        };
      })
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const total = chartData.reduce((sum, item) => sum + item.quantidade, 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <CreditCard className="h-5 w-5 text-primary" />
            Tipo de Negociação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma venda com tipo de negociação definido
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="h-5 w-5 text-primary" />
          Tipo de Negociação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="42%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={4}
                dataKey="quantidade"
                label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 25;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="hsl(var(--foreground))"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                      className="text-[10px] md:text-xs"
                    >
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
                labelLine={{ 
                  strokeWidth: 1, 
                  stroke: "hsl(var(--muted-foreground))",
                }}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props) => {
                  const item = chartData.find((d) => d.name === props.payload.name);
                  return [
                    <div key="tooltip" className="space-y-1">
                      <div>{value} vendas</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item?.valor || 0)}
                      </div>
                    </div>,
                    name,
                  ];
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={40}
                wrapperStyle={{ paddingTop: "5px" }}
                formatter={(value) => (
                  <span className="text-xs md:text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Total: {total} vendas
        </div>
      </CardContent>
    </Card>
  );
}
