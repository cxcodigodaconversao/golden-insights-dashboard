import { useMemo } from "react";
import { CadastroClienteForm } from "./CadastroClienteForm";
import { KanbanBoard } from "./KanbanBoard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePipelineStats } from "@/hooks/usePipeline";
import { useSdrs } from "@/hooks/useAtendimentos";

export function PipelinePage() {
  const { isAdmin, isLider, isSdr } = useAuth();
  const { data: sdrsData = [] } = useSdrs(true);
  const { stats, totalLeads, totalValor, ganhos, taxaConversao } = usePipelineStats();

  const canCadastrar = isAdmin || isLider || isSdr;

  const strs = useMemo(() => {
    return sdrsData
      .filter((s) => s.ativo)
      .map((s) => ({ id: s.id, nome: s.nome }));
  }, [sdrsData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* KPIs do Pipeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLeads}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValor)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas (Ganhos)
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{ganhos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Mini resumo por etapa */}
      <div className="flex flex-wrap gap-2">
        {stats.map((stat) => (
          <Badge
            key={stat.etapa}
            variant="outline"
            className="text-xs py-1 px-2"
            style={{ borderColor: stat.cor }}
          >
            <div
              className="w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: stat.cor }}
            />
            {stat.nome}: {stat.quantidade}
            {stat.valorTotal > 0 && (
              <span className="ml-1 text-muted-foreground">
                ({formatCurrency(stat.valorTotal)})
              </span>
            )}
          </Badge>
        ))}
      </div>

      {/* Formulário de cadastro (apenas para SDR/Admin/Lider) */}
      {canCadastrar && <CadastroClienteForm />}

      {/* Kanban Board */}
      <KanbanBoard strs={strs} />
    </div>
  );
}
