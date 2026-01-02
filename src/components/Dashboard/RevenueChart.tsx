import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Atendimento } from "@/hooks/useAtendimentos";

interface RevenueChartProps {
  data: Atendimento[];
  startDate: Date;
  endDate: Date;
}

export function RevenueChart({ data, startDate, endDate }: RevenueChartProps) {
  // Gerar dados por dia
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const chartData = days.map(day => {
    const dayData = data.filter(a => 
      a.dataCall.toDateString() === day.toDateString() &&
      a.status.includes("Venda") &&
      !a.status.includes("Reembolsada")
    );
    
    const receita = dayData.reduce((acc, v) => acc + (v.valor || 0), 0);
    
    return {
      date: format(day, "dd/MM", { locale: ptBR }),
      receita,
      vendas: dayData.length,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-card">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-primary">
            Receita: R$ {payload[0].value.toLocaleString("pt-BR")}
          </p>
          <p className="text-sm text-muted-foreground">
            Vendas: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(40, 35%, 69%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(40, 35%, 69%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(0, 0%, 53%)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(0, 0%, 53%)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="hsl(40, 35%, 69%)"
            strokeWidth={2}
            fill="url(#colorReceita)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
