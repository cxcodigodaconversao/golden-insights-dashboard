import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  Award,
  Gift,
  Calendar
} from "lucide-react";
import { ClientePipeline } from "@/hooks/usePipeline";
import { useMetas, Meta } from "@/hooks/useMetas";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetasProgressBar } from "./MetasProgressBar";

interface MeuDashboardProps {
  pipelineData: ClientePipeline[];
  tipo: "closer" | "sdr";
  referenciaId: string;
  referenciaNome: string;
  dateRange: { start: Date; end: Date };
}

export function MeuDashboard({ 
  pipelineData, 
  tipo, 
  referenciaId, 
  referenciaNome,
  dateRange 
}: MeuDashboardProps) {
  const currentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const { data: metas = [] } = useMetas(currentMonth);

  const meta = useMemo(() => {
    return metas.find(m => m.tipo === tipo && m.referencia_id === referenciaId);
  }, [metas, tipo, referenciaId]);

  // Filter pipeline data by date range
  const filteredData = useMemo(() => {
    return pipelineData.filter(a => {
      const date = new Date(a.created_at || "");
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [pipelineData, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const vendas = filteredData.filter(
      a => a.etapa_atual === "ganho"
    );
    const perdidas = filteredData.filter(
      a => a.etapa_atual === "perdido"
    );
    const emNegociacao = filteredData.filter(
      a => a.etapa_atual === "em_negociacao" || a.status === "Remarcado"
    );

    const receita = vendas.reduce((sum, a) => sum + (a.valor_potencial || 0), 0);

    return {
      vendas,
      vendasCount: vendas.length,
      perdidas: perdidas.length,
      emNegociacao: emNegociacao.length,
      receita,
      total: filteredData.length,
    };
  }, [filteredData]);

  // Calculate commission
  const comissao = useMemo(() => {
    if (!meta) return { base: 0, bonus: 0, total: 0 };
    
    const comissaoBase = stats.receita * ((meta.comissao_percentual || 0) / 100);
    const metaAtingida = meta.meta_receita > 0 
      ? (stats.receita / meta.meta_receita) >= 1 
      : false;
    const bonus = metaAtingida ? (meta.bonus_extra || 0) : 0;

    return {
      base: comissaoBase,
      bonus,
      total: comissaoBase + bonus,
    };
  }, [meta, stats.receita]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (etapa: string) => {
    if (etapa === "ganho") return "bg-green-500/20 text-green-500";
    if (etapa === "perdido") return "bg-red-500/20 text-red-500";
    if (etapa === "em_negociacao") return "bg-yellow-500/20 text-yellow-500";
    if (etapa === "fechamento_pendente") return "bg-blue-500/20 text-blue-500";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Header with name and campaign info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Olá, {referenciaNome}!</h3>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.start, "dd/MM")} - {format(dateRange.end, "dd/MM/yyyy")}
          </p>
        </div>
        {meta?.campanha_ativa && meta.campanha_nome && (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1 w-fit">
            <Gift className="h-3 w-3" />
            {meta.campanha_nome}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Vendas</p>
                <p className="text-xl sm:text-2xl font-bold text-green-500">{stats.vendasCount}</p>
              </div>
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Perdidas</p>
                <p className="text-xl sm:text-2xl font-bold text-red-500">{stats.perdidas}</p>
              </div>
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Negociando</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-500">{stats.emNegociacao}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Receita</p>
                <p className="text-lg sm:text-xl font-bold text-primary truncate">{formatCurrency(stats.receita)}</p>
              </div>
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta Progress & Commission */}
      {meta && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Meta Progress */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Progresso da Meta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meta.meta_receita > 0 && (
                <MetasProgressBar
                  atual={stats.receita}
                  meta={meta.meta_receita}
                  label="Meta de Receita"
                  formatValue={formatCurrency}
                />
              )}
              {tipo === "sdr" && meta.meta_agendamentos > 0 && (
                <MetasProgressBar
                  atual={stats.total}
                  meta={meta.meta_agendamentos}
                  label="Meta de Agendamentos"
                />
              )}
              {tipo === "sdr" && meta.meta_vendas > 0 && (
                <MetasProgressBar
                  atual={stats.vendasCount}
                  meta={meta.meta_vendas}
                  label="Meta de Vendas"
                />
              )}
            </CardContent>
          </Card>

          {/* Commission Preview */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Previsão de Comissão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Comissão Base ({meta.comissao_percentual || 0}%)
                  </span>
                  <span className="font-medium">{formatCurrency(comissao.base)}</span>
                </div>
                {meta.bonus_extra > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Bônus (ao bater meta)
                    </span>
                    <span className={`font-medium ${comissao.bonus > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                      {comissao.bonus > 0 ? formatCurrency(comissao.bonus) : `(${formatCurrency(meta.bonus_extra)})`}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Total Previsto</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(comissao.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Minhas Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.vendas.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma venda realizada no período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.vendas.slice(0, 10).map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium truncate max-w-[120px]">
                        {venda.nome}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(venda.created_at || ""), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(venda.valor_potencial || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(venda.etapa_atual)}>
                          {venda.etapa_atual === "ganho" ? "Venda" : venda.etapa_atual}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {stats.vendas.length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{stats.vendas.length - 10} vendas não exibidas
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
