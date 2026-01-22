import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface VendasPorOrigemProps {
  data: Array<{
    origem?: string;
    origem_nome?: string;
    status?: string;
    valor?: number;
    valor_potencial?: number;
    etapa_atual?: string;
  }>;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

export function VendasPorOrigem({ data }: VendasPorOrigemProps) {
  const chartData = useMemo(() => {
    // Filter only wins (vendas)
    const vendas = data.filter(a => 
      a.status === "Venda Confirmada" || 
      a.etapa_atual === "ganho"
    );
    
    const origemMap: Record<string, { receita: number; vendas: number }> = {};
    
    vendas.forEach(v => {
      const origem = v.origem_nome || v.origem || "Sem origem";
      if (!origemMap[origem]) {
        origemMap[origem] = { receita: 0, vendas: 0 };
      }
      origemMap[origem].receita += (v.valor_potencial || v.valor || 0);
      origemMap[origem].vendas += 1;
    });
    
    return Object.entries(origemMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 8); // Top 8 origens
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhuma venda encontrada no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          tickFormatter={formatCurrency}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--popover))", 
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--popover-foreground))"
          }}
          formatter={(value: number, name: string) => {
            if (name === "receita") return [formatCurrency(value), "Receita"];
            return [value, "Vendas"];
          }}
        />
        <Legend />
        <Bar 
          yAxisId="left"
          dataKey="receita" 
          name="Receita" 
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
        <Bar 
          yAxisId="right"
          dataKey="vendas" 
          name="Qtd. Vendas" 
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
