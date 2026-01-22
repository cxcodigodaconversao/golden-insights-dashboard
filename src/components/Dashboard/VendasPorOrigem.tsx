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
  "#C9A86C",  // Dourado
  "#3B82F6",  // Azul
  "#22C55E",  // Verde
  "#F59E0B",  // Laranja
  "#8B5CF6",  // Roxo
  "#EC4899",  // Rosa
  "#14B8A6",  // Turquesa
  "#EF4444",  // Vermelho
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
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          angle={-35}
          textAnchor="end"
          height={70}
          interval={0}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          tickFormatter={formatCurrency}
          width={70}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickLine={{ stroke: "hsl(var(--border))" }}
          width={40}
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
        <Legend 
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value) => <span className="text-xs md:text-sm">{value}</span>}
        />
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
          fill="#64748B"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
