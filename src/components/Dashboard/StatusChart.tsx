import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Atendimento } from "@/hooks/useAtendimentos";

interface StatusChartProps {
  data: Atendimento[];
}

const STATUS_COLORS: Record<string, string> = {
  "Vendas": "#22c55e",
  "Pagamento agendado": "#eab308",
  "Em negociação": "#d2bc8f",
  "Não compareceu": "#ef4444",
  "Sem interesse": "#6b7280",
  "Outros": "#374151",
};

export function StatusChart({ data }: StatusChartProps) {
  // Agrupar por categoria de status
  const statusGroups: Record<string, number> = {
    "Vendas": 0,
    "Pagamento agendado": 0,
    "Em negociação": 0,
    "Não compareceu": 0,
    "Sem interesse": 0,
    "Outros": 0,
  };

  data.forEach(item => {
    if (item.status.includes("Venda") && !item.status.includes("Reembolsada")) {
      statusGroups["Vendas"]++;
    } else if (item.status === "Pagamento agendado") {
      statusGroups["Pagamento agendado"]++;
    } else if (item.status === "Em negociação") {
      statusGroups["Em negociação"]++;
    } else if (item.status === "Não compareceu") {
      statusGroups["Não compareceu"]++;
    } else if (item.status === "Sem interesse" || item.status === "Sem dinheiro") {
      statusGroups["Sem interesse"]++;
    } else {
      statusGroups["Outros"]++;
    }
  });

  const chartData = Object.entries(statusGroups)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

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
                fill={STATUS_COLORS[entry.name] || "#374151"}
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
