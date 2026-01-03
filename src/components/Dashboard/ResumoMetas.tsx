import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Users, Headphones } from "lucide-react";
import { useMetas } from "@/hooks/useMetas";
import { useClosers, useSdrs, useAtendimentos } from "@/hooks/useAtendimentos";
import { useLancamentosSDR } from "@/hooks/useLancamentos";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResumoMetasProps {
  teamFilter?: string | null;
}

interface MetaProgress {
  id: string;
  nome: string;
  tipo: "closer" | "sdr";
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

export function ResumoMetas({ teamFilter }: ResumoMetasProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => 
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [selectedTipo, setSelectedTipo] = useState<"closer" | "sdr" | "todos">("todos");

  const { data: metas = [] } = useMetas(selectedMonth);
  const { data: closers = [] } = useClosers(true);
  const { data: sdrs = [] } = useSdrs(true);
  const { data: atendimentos = [] } = useAtendimentos();
  const { data: lancamentosSdr = [] } = useLancamentosSDR();

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
    if (!teamFilter) return closers;
    return closers.filter(c => c.time_id === teamFilter);
  }, [closers, teamFilter]);

  const filteredSdrs = useMemo(() => {
    if (!teamFilter) return sdrs;
    return sdrs.filter(s => s.time_id === teamFilter);
  }, [sdrs, teamFilter]);

  // Calculate progress for each closer/SDR
  const metasProgress = useMemo(() => {
    const progress: MetaProgress[] = [];

    // Process Closers
    filteredClosers.forEach(closer => {
      const meta = metas.find(m => m.tipo === "closer" && m.referencia_id === closer.id);
      
      // Calculate realized values from atendimentos
      const closerAtendimentos = atendimentos.filter(a => {
        const date = new Date(a.data_call);
        return a.closer === closer.nome && 
               date >= monthStart && 
               date <= monthEnd;
      });

      const realizadoVendas = closerAtendimentos.filter(a => a.status === "Ganho").length;
      const realizadoReceita = closerAtendimentos
        .filter(a => a.status === "Ganho")
        .reduce((sum, a) => sum + (a.valor || 0), 0);

      const metaVendas = meta?.meta_vendas || 0;
      const metaReceita = meta?.meta_receita || 0;

      const progressoVendas = metaVendas > 0 ? (realizadoVendas / metaVendas) * 100 : 0;
      const progressoReceita = metaReceita > 0 ? (realizadoReceita / metaReceita) * 100 : 0;

      // Determine status based on highest progress
      const maxProgresso = Math.max(progressoVendas, progressoReceita);
      let status: MetaProgress["status"] = "sem_meta";
      if (meta) {
        if (maxProgresso >= 100) status = "bateu";
        else if (maxProgresso >= 80) status = "perto";
        else status = "atrasado";
      }

      progress.push({
        id: closer.id,
        nome: closer.nome,
        tipo: "closer",
        metaVendas,
        metaReceita,
        metaAgendamentos: 0,
        realizadoVendas,
        realizadoReceita,
        realizadoAgendamentos: 0,
        progressoVendas,
        progressoReceita,
        progressoAgendamentos: 0,
        status,
      });
    });

    // Process SDRs
    filteredSdrs.forEach(sdr => {
      const meta = metas.find(m => m.tipo === "sdr" && m.referencia_id === sdr.id);

      // Calculate realized values from lancamentos_sdr
      const sdrLancamentos = lancamentosSdr.filter(l => {
        const date = new Date(l.data);
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
  }, [filteredClosers, filteredSdrs, metas, atendimentos, lancamentosSdr, monthStart, monthEnd]);

  // Filter by type
  const filteredProgress = useMemo(() => {
    if (selectedTipo === "todos") return metasProgress;
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

  const getStatusColor = (status: MetaProgress["status"]) => {
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
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Mês</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
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
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Tipo</label>
          <Select value={selectedTipo} onValueChange={(v: "closer" | "sdr" | "todos") => setSelectedTipo(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
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
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Meta</p>
                <p className="text-3xl font-bold text-foreground">{kpis.total}</p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bateram (100%+)</p>
                <p className="text-3xl font-bold text-green-500">{kpis.bateram}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Perto (80-99%)</p>
                <p className="text-3xl font-bold text-yellow-500">{kpis.perto}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atrasados (&lt;80%)</p>
                <p className="text-3xl font-bold text-red-500">{kpis.atrasados}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress List */}
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
                  ? Math.max(item.progressoVendas, item.progressoReceita)
                  : Math.max(item.progressoVendas, item.progressoAgendamentos);
                
                return (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-lg border border-border bg-secondary/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-8">
                          {index + 1}º
                        </span>
                        <div className="flex items-center gap-2">
                          {item.tipo === "closer" ? (
                            <Users className="h-4 w-4 text-primary" />
                          ) : (
                            <Headphones className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="font-semibold text-foreground">{item.nome}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.tipo === "closer" ? "Closer" : "SDR"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${getStatusColor(item.status)}`}>
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

                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      {item.tipo === "closer" ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vendas:</span>
                            <span className="font-medium">
                              {item.realizadoVendas} / {item.metaVendas}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Receita:</span>
                            <span className="font-medium">
                              {formatCurrency(item.realizadoReceita)} / {formatCurrency(item.metaReceita)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Agendamentos:</span>
                            <span className="font-medium">
                              {item.realizadoAgendamentos} / {item.metaAgendamentos}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vendas:</span>
                            <span className="font-medium">
                              {item.realizadoVendas} / {item.metaVendas}
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
    </div>
  );
}