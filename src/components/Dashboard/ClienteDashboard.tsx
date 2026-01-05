import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAtendimentos } from "@/hooks/useAtendimentos";
import { useMemo } from "react";
import { BarChart3, Users, TrendingUp, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ClienteDashboard() {
  const { profile } = useAuth();
  const { data: atendimentos, isLoading } = useAtendimentos();

  // Filtrar atendimentos pelo cliente_id do perfil
  const clienteAtendimentos = useMemo(() => {
    if (!atendimentos || !profile?.cliente_id) return [];
    return atendimentos.filter(a => a.cliente_id === profile.cliente_id);
  }, [atendimentos, profile?.cliente_id]);

  // Métricas agregadas
  const metricas = useMemo(() => {
    const now = new Date();
    const startMonth = startOfMonth(now);
    const endMonth = endOfMonth(now);

    const atendimentosMes = clienteAtendimentos.filter(a => {
      const dataCall = new Date(a.data_call);
      return dataCall >= startMonth && dataCall <= endMonth;
    });

    const total = atendimentosMes.length;
    const vendas = atendimentosMes.filter(a => a.status === 'Vendeu').length;
    const emNegociacao = atendimentosMes.filter(a => a.status === 'Em negociação').length;
    const taxaConversao = total > 0 ? ((vendas / total) * 100).toFixed(1) : '0';

    return {
      total,
      vendas,
      emNegociacao,
      taxaConversao,
    };
  }, [clienteAtendimentos]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const statusCount: Record<string, number> = {};
    clienteAtendimentos.forEach(a => {
      statusCount[a.status] = (statusCount[a.status] || 0) + 1;
    });
    return Object.entries(statusCount)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [clienteAtendimentos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (!profile?.cliente_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Sua conta ainda não está vinculada a uma operação.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Entre em contato com o administrador para configurar seu acesso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Dashboard da Operação
        </h2>
        <p className="text-sm text-muted-foreground">
          Visualização de métricas agregadas - {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.total}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.vendas}</div>
            <p className="text-xs text-muted-foreground">Conversões este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Negociação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.emNegociacao}</div>
            <p className="text-xs text-muted-foreground">Leads ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.taxaConversao}%</div>
            <p className="text-xs text-muted-foreground">Leads → Vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusDistribution.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-3">
              {statusDistribution.map(({ status, count }) => {
                const total = clienteAtendimentos.length;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{status}</span>
                      <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nota de privacidade */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            📊 Dados agregados da sua operação. Informações individuais de vendedores não são exibidas por questões de privacidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
