import { useState, useMemo } from "react";
import { Header } from "@/components/Dashboard/Header";
import { KPICard } from "@/components/Dashboard/KPICard";
import { PeriodFilter, PeriodType } from "@/components/Dashboard/PeriodFilter";
import { RevenueChart } from "@/components/Dashboard/RevenueChart";
import { StatusChart } from "@/components/Dashboard/StatusChart";
import { CloserRanking } from "@/components/Dashboard/CloserRanking";
import { AtendimentosTable } from "@/components/Dashboard/AtendimentosTable";
import { useAtendimentos, useClosers, calcularMetricas, calcularRankingClosers } from "@/hooks/useAtendimentos";
import { DollarSign, Users, TrendingUp, Target, Phone, Loader2 } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useAtendimentos();
  const { data: closersData = [], isLoading: isLoadingClosers } = useClosers();

  const closersList = useMemo(() => closersData.map(c => c.nome), [closersData]);

  const handlePeriodChange = (start: Date, end: Date, type: PeriodType) => {
    setDateRange({ start, end });
    setPeriodType(type);
  };

  const filteredData = useMemo(() => {
    return atendimentos.filter(
      (a) => a.dataCall >= dateRange.start && a.dataCall <= dateRange.end
    );
  }, [atendimentos, dateRange]);

  const metricas = useMemo(() => {
    return calcularMetricas(atendimentos, dateRange.start, dateRange.end);
  }, [atendimentos, dateRange]);

  const ranking = useMemo(() => {
    return calcularRankingClosers(atendimentos, closersList, dateRange.start, dateRange.end);
  }, [atendimentos, closersList, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isLoading = isLoadingAtendimentos || isLoadingClosers;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Título e Filtros */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="opacity-0 animate-fade-in">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Dashboard de Resultados
            </h2>
            <p className="text-muted-foreground">
              {format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} -{" "}
              {format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <PeriodFilter onPeriodChange={handlePeriodChange} currentPeriod={periodType} />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[350px] rounded-xl" />
              <Skeleton className="h-[350px] rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <KPICard
                title="Receita Total"
                value={formatCurrency(metricas.receita)}
                icon={DollarSign}
                variant="gold"
                delay={100}
              />
              <KPICard
                title="Total de Vendas"
                value={metricas.vendas}
                subtitle={`${metricas.totalAtendimentos} atendimentos`}
                icon={TrendingUp}
                variant="success"
                delay={200}
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${metricas.taxaConversao.toFixed(1)}%`}
                icon={Target}
                delay={300}
              />
              <KPICard
                title="Ticket Médio"
                value={formatCurrency(metricas.ticketMedio)}
                icon={DollarSign}
                delay={400}
              />
              <KPICard
                title="Comparecimento"
                value={`${metricas.taxaComparecimento.toFixed(1)}%`}
                subtitle={`${metricas.naoCompareceram} no-shows`}
                icon={Users}
                variant={metricas.taxaComparecimento >= 70 ? "success" : "warning"}
                delay={500}
              />
              <KPICard
                title="Atendimentos"
                value={metricas.totalAtendimentos}
                icon={Phone}
                delay={600}
              />
            </div>

            {/* Gráficos */}
            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-3">
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Receita por Período
                </h3>
                <RevenueChart data={filteredData} startDate={dateRange.start} endDate={dateRange.end} />
              </div>
              <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-4">
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Distribuição por Status
                </h3>
                <StatusChart data={filteredData} />
              </div>
            </div>

            {/* Ranking e Tabela */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Ranking de Closers
                </h3>
                <CloserRanking data={ranking} />
              </div>
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Atendimentos
                </h3>
                <AtendimentosTable data={filteredData} />
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && atendimentos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4">
              <Loader2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              Nenhum atendimento encontrado
            </h3>
            <p className="text-muted-foreground">
              Importe seus dados ou adicione atendimentos para começar.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>FC-360 Dashboard © {new Date().getFullYear()} • Relatório Diário de Atendimentos</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
