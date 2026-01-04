import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Users, Headphones, Shield } from "lucide-react";
import { useMetas } from "@/hooks/useMetas";
import { useClosers, useSdrs, useAtendimentos, useTimes } from "@/hooks/useAtendimentos";
import { useLancamentosSDR, useLancamentosDisparo, useLancamentosTrafego } from "@/hooks/useLancamentos";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResumoMetasProps {
  teamFilter?: string | null;
  userCloserId?: string | null;
  userSdrId?: string | null;
}

interface MetaProgress {
  id: string;
  nome: string;
  tipo: "closer" | "sdr";
  timeId: string | null;
  timeNome?: string;
  metaVendas: number;
  metaReceita: number;
  metaAgendamentos: number;
  realizadoVendas: number;
  realizadoReceita: number;
  realizadoAgendamentos: number;
  progressoVendas: number;
  progressoReceita: number;
  progressoAgendamentos: number;
  status: "bateu" | "perto" | "atrasado" | "sem_meta";
}

interface TeamProgress {
  id: string;
  nome: string;
  cor: string;
  totalClosers: number;
  totalSdrs: number;
  metaVendasTotal: number;
  metaReceitaTotal: number;
  metaAgendamentosTotal: number;
  realizadoVendas: number;
  realizadoReceita: number;
  realizadoAgendamentos: number;
  progressoVendas: number;
  progressoReceita: number;
  status: "bateu" | "perto" | "atrasado";
}

export function ResumoMetas({ teamFilter, userCloserId, userSdrId }: ResumoMetasProps) {
  const isUserView = !!(userCloserId || userSdrId);
  
  const [selectedMonth, setSelectedMonth] = useState(() => 
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [selectedTipo, setSelectedTipo] = useState<"closer" | "sdr" | "todos" | "times">(
    userCloserId ? "closer" : userSdrId ? "sdr" : "todos"
  );

  const { data: metas = [] } = useMetas(selectedMonth);
  const { data: closers = [] } = useClosers(true);
  const { data: sdrs = [] } = useSdrs(true);
  const { data: times = [] } = useTimes(true);
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: lancamentosSdr = [] } = useLancamentosSDR();
  const { data: lancamentosDisparo = [] } = useLancamentosDisparo();
  const { data: lancamentosTrafego = [] } = useLancamentosTrafego();

  const months = useMemo(() => {
    const result = [];
    for (let i = -6; i <= 3; i++) {
      const date = addMonths(startOfMonth(new Date()), i);
      result.push({
        value: format(date, "yyyy-MM-dd"),
        label: format(date, "MMMM yyyy", { locale: ptBR }),
      });
    }
    return result;
  }, []);

  const monthStart = useMemo(() => parseISO(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);

  // Filter by team if specified
  const filteredClosers = useMemo(() => {
    // If user is a vendedor, only show their data
    if (userCloserId) {
      return closers.filter(c => c.id === userCloserId);
    }
    if (!teamFilter) return closers;
    return closers.filter(c => c.time_id === teamFilter);
  }, [closers, teamFilter, userCloserId]);

  const filteredSdrs = useMemo(() => {
    // If user is an SDR, only show their data
    if (userSdrId) {
      return sdrs.filter(s => s.id === userSdrId);
    }
    if (!teamFilter) return sdrs;
    return sdrs.filter(s => s.time_id === teamFilter);
  }, [sdrs, teamFilter, userSdrId]);

  // Calculate progress for each closer/SDR
  const metasProgress = useMemo(() => {
    const progress: MetaProgress[] = [];

    // Process Closers
    filteredClosers.forEach(closer => {
      const meta = metas.find(m => m.tipo === "closer" && m.referencia_id === closer.id);
      const time = times.find(t => t.id === closer.time_id);
      
      // Calculate realized values from atendimentos (status = "Venda Confirmada" or "Ganho")
      const closerAtendimentos = atendimentos.filter(a => {
        const date = new Date(a.data_call);
        return a.closer === closer.nome && 
               date >= monthStart && 
               date <= monthEnd;
      });

      // Count vendas from atendimentos with Venda Confirmada or Ganho status
      const vendasAtendimentos = closerAtendimentos.filter(
        a => a.status === "Venda Confirmada" || a.status === "Ganho"
      );
      const vendasAtendimentosCount = vendasAtendimentos.length;
      const receitaAtendimentos = vendasAtendimentos.reduce((sum, a) => sum + (a.valor || 0), 0);

      // Also count vendas from lancamentos_disparo and lancamentos_trafego
      const closerLancamentosDisparo = lancamentosDisparo.filter(l => {
        const date = parseISO(l.data);
        return l.closer_id === closer.id &&
               date >= monthStart &&
               date <= monthEnd;
      });

      const closerLancamentosTrafego = lancamentosTrafego.filter(l => {
        const date = parseISO(l.data);
        return l.closer_id === closer.id &&
               date >= monthStart &&
               date <= monthEnd;
      });

      const vendasDisparo = closerLancamentosDisparo.reduce((sum, l) => sum + (l.vendas || 0), 0);
      const receitaDisparo = closerLancamentosDisparo.reduce((sum, l) => sum + Number(l.receita || 0), 0);
      
      const vendasTrafego = closerLancamentosTrafego.reduce((sum, l) => sum + (l.vendas || 0), 0);
      const receitaTrafego = closerLancamentosTrafego.reduce((sum, l) => sum + Number(l.receita || 0), 0);

      // Total vendas e receita from all sources
      const realizadoVendas = vendasAtendimentosCount + vendasDisparo + vendasTrafego;
      const realizadoReceita = receitaAtendimentos + receitaDisparo + receitaTrafego;

      const metaReceita = meta?.meta_receita || 0;

      // For closers, only revenue has a goal - but we still show realized vendas
      const progressoReceita = metaReceita > 0 ? (realizadoReceita / metaReceita) * 100 : 0;

      // Determine status based on revenue progress only for closers
      let status: MetaProgress["status"] = "sem_meta";
      if (meta && metaReceita > 0) {
        if (progressoReceita >= 100) status = "bateu";
        else if (progressoReceita >= 80) status = "perto";
        else status = "atrasado";
      }

      progress.push({
        id: closer.id,
        nome: closer.nome,
        tipo: "closer",
        timeId: closer.time_id || null,
        timeNome: time?.nome,
        metaVendas: 0, // Closers don't have sales goal
        metaReceita,
        metaAgendamentos: 0,
        realizadoVendas,
        realizadoReceita,
        realizadoAgendamentos: 0,
        progressoVendas: 0, // No sales goal tracking for closers
        progressoReceita,
        progressoAgendamentos: 0,
        status,
      });
    });

    // Process SDRs
    filteredSdrs.forEach(sdr => {
      const meta = metas.find(m => m.tipo === "sdr" && m.referencia_id === sdr.id);
      const time = times.find(t => t.id === sdr.time_id);

      // Calculate realized values from lancamentos_sdr
      const sdrLancamentos = lancamentosSdr.filter(l => {
        const date = parseISO(l.data);
        return l.sdr_id === sdr.id &&
               date >= monthStart &&
               date <= monthEnd;
      });

      const realizadoAgendamentos = sdrLancamentos.reduce((sum, l) => sum + (l.agendamentos || 0), 0);
      const realizadoVendas = sdrLancamentos.reduce((sum, l) => sum + (l.vendas_agendamentos || 0), 0);

      const metaVendas = meta?.meta_vendas || 0;
      const metaAgendamentos = meta?.meta_agendamentos || 0;

      const progressoVendas = metaVendas > 0 ? (realizadoVendas / metaVendas) * 100 : 0;
      const progressoAgendamentos = metaAgendamentos > 0 ? (realizadoAgendamentos / metaAgendamentos) * 100 : 0;

      // Determine status
      const maxProgresso = Math.max(progressoVendas, progressoAgendamentos);
      let status: MetaProgress["status"] = "sem_meta";
      if (meta) {
        if (maxProgresso >= 100) status = "bateu";
        else if (maxProgresso >= 80) status = "perto";
        else status = "atrasado";
      }

      progress.push({
        id: sdr.id,
        nome: sdr.nome,
        tipo: "sdr",
        timeId: sdr.time_id || null,
        timeNome: time?.nome,
        metaVendas,
        metaReceita: 0,
        metaAgendamentos,
        realizadoVendas,
        realizadoReceita: 0,
        realizadoAgendamentos,
        progressoVendas,
        progressoReceita: 0,
        progressoAgendamentos,
        status,
      });
    });

    return progress;
  }, [filteredClosers, filteredSdrs, metas, atendimentos, lancamentosSdr, lancamentosDisparo, lancamentosTrafego, monthStart, monthEnd, times]);

  // Calculate team progress (for líderes)
  const teamsProgress = useMemo(() => {
    const filteredTimes = teamFilter ? times.filter(t => t.id === teamFilter) : times;
    
    return filteredTimes.map(time => {
      const teamClosers = metasProgress.filter(m => m.tipo === "closer" && m.timeId === time.id);
      const teamSdrs = metasProgress.filter(m => m.tipo === "sdr" && m.timeId === time.id);
      
      const metaVendasTotal = teamClosers.reduce((sum, c) => sum + c.metaVendas, 0);
      const metaReceitaTotal = teamClosers.reduce((sum, c) => sum + c.metaReceita, 0);
      const metaAgendamentosTotal = teamSdrs.reduce((sum, s) => sum + s.metaAgendamentos, 0);
      
      const realizadoVendas = teamClosers.reduce((sum, c) => sum + c.realizadoVendas, 0);
      const realizadoReceita = teamClosers.reduce((sum, c) => sum + c.realizadoReceita, 0);
      const realizadoAgendamentos = teamSdrs.reduce((sum, s) => sum + s.realizadoAgendamentos, 0);
      
      const progressoVendas = metaVendasTotal > 0 ? (realizadoVendas / metaVendasTotal) * 100 : 0;
      const progressoReceita = metaReceitaTotal > 0 ? (realizadoReceita / metaReceitaTotal) * 100 : 0;
      
      const maxProgresso = Math.max(progressoVendas, progressoReceita);
      let status: TeamProgress["status"] = "atrasado";
      if (maxProgresso >= 100) status = "bateu";
      else if (maxProgresso >= 80) status = "perto";

      return {
        id: time.id,
        nome: time.nome,
        cor: time.cor || "#d2bc8f",
        totalClosers: teamClosers.length,
        totalSdrs: teamSdrs.length,
        metaVendasTotal,
        metaReceitaTotal,
        metaAgendamentosTotal,
        realizadoVendas,
        realizadoReceita,
        realizadoAgendamentos,
        progressoVendas,
        progressoReceita,
        status,
      } as TeamProgress;
    }).filter(t => t.totalClosers > 0 || t.totalSdrs > 0);
  }, [metasProgress, times, teamFilter]);

  // Filter by type
  const filteredProgress = useMemo(() => {
    if (selectedTipo === "todos") return metasProgress;
    if (selectedTipo === "times") return []; // handled separately
    return metasProgress.filter(m => m.tipo === selectedTipo);
  }, [metasProgress, selectedTipo]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const withMeta = filteredProgress.filter(p => p.status !== "sem_meta");
    return {
      total: withMeta.length,
      bateram: withMeta.filter(p => p.status === "bateu").length,
      perto: withMeta.filter(p => p.status === "perto").length,
      atrasados: withMeta.filter(p => p.status === "atrasado").length,
    };
  }, [filteredProgress]);

  // Sort by progress (highest first)
  const sortedProgress = useMemo(() => {
    return [...filteredProgress]
      .filter(p => p.status !== "sem_meta")
      .sort((a, b) => {
        const aMax = Math.max(a.progressoVendas, a.progressoReceita, a.progressoAgendamentos);
        const bMax = Math.max(b.progressoVendas, b.progressoReceita, b.progressoAgendamentos);
        return bMax - aMax;
      });
  }, [filteredProgress]);

  const getStatusColor = (status: MetaProgress["status"] | TeamProgress["status"]) => {
    switch (status) {
      case "bateu": return "text-green-500";
      case "perto": return "text-yellow-500";
      case "atrasado": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: MetaProgress["status"]) => {
    switch (status) {
      case "bateu": return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Bateu!</Badge>;
      case "perto": return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Quase!</Badge>;
      case "atrasado": return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Atenção</Badge>;
      default: return <Badge variant="outline">Sem meta</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 80) return "bg-yellow-500";
    if (progress >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

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
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Mês</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Only show type filter for admin/leader */}
        {!isUserView && (
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Tipo</label>
            <Select value={selectedTipo} onValueChange={(v: "closer" | "sdr" | "todos" | "times") => setSelectedTipo(v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="times">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Times
                  </div>
                </SelectItem>
                <SelectItem value="closer">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Closers
                  </div>
                </SelectItem>
                <SelectItem value="sdr">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    SDRs
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* KPI Cards - only show when not viewing times */}
      {selectedTipo !== "times" && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Com Meta</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{kpis.total}</p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-80 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Bateram</p>
                  <p className="text-xl sm:text-3xl font-bold text-green-500">{kpis.bateram}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 opacity-80 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Perto</p>
                  <p className="text-xl sm:text-3xl font-bold text-yellow-500">{kpis.perto}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 opacity-80 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:pt-6 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Atrasados</p>
                  <p className="text-xl sm:text-3xl font-bold text-red-500">{kpis.atrasados}</p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 opacity-80 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Teams Progress */}
      {selectedTipo === "times" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Progresso por Time - {format(parseISO(selectedMonth), "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamsProgress.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum time com metas definidas para este período.
              </p>
            ) : (
              <div className="space-y-4">
                {teamsProgress.map((team, index) => {
                  const mainProgress = Math.max(team.progressoVendas, team.progressoReceita);
                  
                  return (
                    <div 
                      key={team.id} 
                      className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-sm sm:text-lg font-bold text-muted-foreground w-6 sm:w-8 shrink-0">
                            {index + 1}º
                          </span>
                          <div 
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: team.cor }}
                          />
                          <span className="font-semibold text-foreground text-sm sm:text-base truncate">{team.nome}</span>
                          <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                            {team.totalClosers}C • {team.totalSdrs}S
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 pl-8 sm:pl-0">
                          <span className={`text-lg sm:text-2xl font-bold ${getStatusColor(team.status)}`}>
                            {Math.round(mainProgress)}%
                          </span>
                          {team.status === "bateu" && (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Bateu!</Badge>
                          )}
                          {team.status === "perto" && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">Quase!</Badge>
                          )}
                          {team.status === "atrasado" && (
                            <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">Atenção</Badge>
                          )}
                        </div>
                      </div>

                      <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${getProgressColor(mainProgress)}`}
                          style={{ width: `${Math.min(mainProgress, 100)}%` }}
                        />
                      </div>

                      <div className="grid gap-1 sm:gap-2 grid-cols-1 sm:grid-cols-3 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vendas:</span>
                          <span className="font-medium">
                            {team.realizadoVendas}/{team.metaVendasTotal}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Receita:</span>
                          <span className="font-medium truncate ml-2">
                            {formatCurrency(team.realizadoReceita)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Agend.:</span>
                          <span className="font-medium">
                            {team.realizadoAgendamentos}/{team.metaAgendamentosTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual Progress List */}
      {selectedTipo !== "times" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="h-5 w-5 text-primary" />
              Progresso de Metas - {format(parseISO(selectedMonth), "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedProgress.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma meta definida para este período.
              </p>
            ) : (
              <div className="space-y-4">
                {sortedProgress.map((item, index) => {
                  const mainProgress = item.tipo === "closer" 
                    ? item.progressoReceita
                    : Math.max(item.progressoVendas, item.progressoAgendamentos);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-sm sm:text-lg font-bold text-muted-foreground w-6 sm:w-8 shrink-0">
                            {index + 1}º
                          </span>
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            {item.tipo === "closer" ? (
                              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                            ) : (
                              <Headphones className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                            )}
                            <span className="font-semibold text-foreground text-sm sm:text-base truncate">{item.nome}</span>
                          </div>
                          <Badge variant="outline" className="text-xs hidden sm:inline-flex shrink-0">
                            {item.tipo === "closer" ? "Closer" : "SDR"}
                          </Badge>
                          {item.timeNome && (
                            <Badge variant="secondary" className="text-xs hidden md:inline-flex shrink-0">
                              {item.timeNome}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 pl-8 sm:pl-0">
                          <span className={`text-lg sm:text-2xl font-bold ${getStatusColor(item.status)}`}>
                            {Math.round(mainProgress)}%
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className={`absolute left-0 top-0 h-full rounded-full transition-all ${getProgressColor(mainProgress)}`}
                          style={{ width: `${Math.min(mainProgress, 100)}%` }}
                        />
                      </div>

                      <div className="grid gap-1 sm:gap-2 grid-cols-1 sm:grid-cols-2 text-xs sm:text-sm">
                        {item.tipo === "closer" ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vendas:</span>
                              <span className="font-medium">
                                {item.realizadoVendas}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Receita:</span>
                              <span className="font-medium truncate ml-2">
                                {formatCurrency(item.realizadoReceita)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Agend.:</span>
                              <span className="font-medium">
                                {item.realizadoAgendamentos}/{item.metaAgendamentos}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vendas:</span>
                              <span className="font-medium">
                                {item.realizadoVendas}/{item.metaVendas}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
