import { useMemo } from "react";
import { KPICard } from "@/components/Dashboard/KPICard";
import { RevenueChart } from "@/components/Dashboard/RevenueChart";
import { StatusChart } from "@/components/Dashboard/StatusChart";
import { CloserRanking } from "@/components/Dashboard/CloserRanking";
import { SDRRanking } from "@/components/Dashboard/SDRRanking";
import { TeamRanking } from "@/components/Dashboard/TeamRanking";
import { ConversionFunnel } from "@/components/Dashboard/ConversionFunnel";
import { PeriodComparison } from "@/components/Dashboard/PeriodComparison";
import { AtendimentosTable } from "@/components/Dashboard/AtendimentosTable";
import { VendasPorOrigem } from "@/components/Dashboard/VendasPorOrigem";
import { ClientePipeline } from "@/hooks/usePipeline";
import { calcularMetricasPipeline, calcularRankingClosersPipeline } from "@/hooks/usePipelineForDashboard";
import { DollarSign, Users, TrendingUp, Target, Phone, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Time {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

interface Closer {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
}

interface SDR {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
}

interface DashboardContentProps {
  pipelineData: ClientePipeline[];
  closersList: string[];
  sdrsList: string[];
  dateRange: { start: Date; end: Date };
  isLoading: boolean;
  times?: Time[];
  closers?: Closer[];
  sdrs?: SDR[];
}

export function DashboardContent({ 
  pipelineData, 
  closersList, 
  sdrsList, 
  dateRange, 
  isLoading,
  times = [],
  closers = [],
  sdrs = []
}: DashboardContentProps) {
  // Converter Leads para formato de Atendimento para compatibilidade com componentes existentes
  const atendimentosFormatados = useMemo(() => {
    return pipelineData.map(p => ({
      id: p.id,
      nome: p.nome,
      telefone: p.whatsapp,
      email: p.email || "",
      closer: p.closer_nome || "",
      sdr: p.sdr_nome || p.str_responsavel_nome || "",
      origem: p.origem_nome || p.origem_lead || "",
      status: p.etapa_atual === "ganho" ? "Venda Confirmada" : 
              p.etapa_atual === "perdido" ? "Perdido" : 
              p.status || "Em negociação",
      valor: p.valor_potencial || 0,
      data_call: p.data_call || p.created_at || "",
      dataCall: new Date(p.data_call || p.created_at || ""),
      gravacao: p.gravacao || "",
      info_sdr: p.info_sdr || "",
      created_at: p.created_at || "",
      updated_at: p.updated_at || "",
      google_event_id: null,
      google_meet_link: null,
      lead_id: null,
      hora_call: p.hora_call,
      cliente_id: p.cliente_id,
    }));
  }, [pipelineData]);

  const filteredData = useMemo(() => {
    return atendimentosFormatados.filter((a) => {
      const createdAt = new Date(a.created_at || "");
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });
  }, [atendimentosFormatados, dateRange]);

  const metricas = useMemo(() => {
    return calcularMetricasPipeline(pipelineData, dateRange.start, dateRange.end);
  }, [pipelineData, dateRange]);

  const ranking = useMemo(() => {
    return calcularRankingClosersPipeline(pipelineData, closersList, dateRange.start, dateRange.end);
  }, [pipelineData, closersList, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
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
    );
  }

  if (pipelineData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-secondary p-4">
          <Loader2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          Nenhum lead encontrado
        </h3>
        <p className="text-muted-foreground">
          Vá para a aba "Cadastro de Leads" para cadastrar seus primeiros leads.
        </p>
      </div>
    );
  }

  return (
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
          subtitle={`${metricas.totalLeads} leads`}
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
          title="Leads"
          value={metricas.totalLeads}
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

      {/* Vendas por Origem */}
      <div className="mb-8">
        <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
            📊 Vendas por Origem
          </h3>
          <VendasPorOrigem data={filteredData} />
        </div>
      </div>

      {/* Funil e Comparativo */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
            Funil de Conversão
          </h3>
          <ConversionFunnel data={filteredData} />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
            Comparativo de Períodos
          </h3>
          <PeriodComparison 
            data={atendimentosFormatados} 
            currentStart={dateRange.start} 
            currentEnd={dateRange.end} 
          />
        </div>
      </div>

      {/* Ranking de Times */}
      {times.length > 0 && (
        <div className="mb-8">
          <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
              🏆 Ranking de Times
            </h3>
            <TeamRanking data={filteredData} times={times} closers={closers} />
          </div>
        </div>
      )}

      {/* Rankings de Closers e SDRs */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
            Ranking de Closers
          </h3>
          <CloserRanking data={ranking} times={times} closers={closers} />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
            Ranking de SDRs
          </h3>
          <SDRRanking data={filteredData} sdrsList={sdrsList} times={times} sdrs={sdrs} />
        </div>
      </div>

      {/* Tabela de Atendimentos */}
      <div className="rounded-xl border border-border bg-card p-6 card-shadow opacity-0 animate-fade-in stagger-5">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
          Atendimentos
        </h3>
        <AtendimentosTable data={filteredData} />
      </div>
    </>
  );
}
