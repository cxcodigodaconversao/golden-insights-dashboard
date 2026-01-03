import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Atendimento } from "@/hooks/useAtendimentos";

interface StatusChartProps {
  data: Atendimento[];
}

const STATUS_COLORS: Record<string, string> = {
  "Venda Confirmada": "#22c55e",
  "Venda Recorrente": "#16a34a",
  "Venda": "#22c55e",
  "Pagamento agendado": "#eab308",
  "Em negociação": "#d2bc8f",
  "Não compareceu": "#f97316",  // Laranja
  "Não fechou": "#ef4444",       // Vermelho
  "Sem interesse": "#6b7280",
  "Sem dinheiro": "#9ca3af",
  "Reembolsada": "#dc2626",
  "Cancelado": "#b91c1c",
  "Call Remarcada": "#8b5cf6",
  "Sem qualificação": "#64748b",
  "Não é prioridade": "#94a3b8",
  "Quer apenas no futuro": "#a855f7",
};

const DEFAULT_COLOR = "#374151";

export function StatusChart({ data }: StatusChartProps) {
  // Contar cada status real individualmente
  const statusCounts: Record<string, number> = {};

  data.forEach(item => {
    const status = item.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const chartData = Object.entries(statusCounts)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-card">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary">{payload[0].value} atendimentos</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR}
                stroke="hsl(220, 35%, 8%)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
