import { useState, useMemo } from "react";
import { Header } from "@/components/Dashboard/Header";
import { PeriodFilter, PeriodType } from "@/components/Dashboard/PeriodFilter";
import { TeamFilter } from "@/components/Dashboard/TeamFilter";
import { AdvancedFilters } from "@/components/Dashboard/AdvancedFilters";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import { MeuDashboard } from "@/components/Dashboard/MeuDashboard";
import { ClienteDashboard } from "@/components/Dashboard/ClienteDashboard";
import { usePipelineForDashboard, calcularMetricasPipeline, calcularRankingClosersPipeline } from "@/hooks/usePipelineForDashboard";
import { GestaoClosers } from "@/components/Dashboard/GestaoClosers";
import { GestaoSDRs } from "@/components/Dashboard/GestaoSDRs";
import { GestaoOrigens } from "@/components/Dashboard/GestaoOrigens";
import { GestaoTimes } from "@/components/Dashboard/GestaoTimes";
import { GestaoLideres } from "@/components/Dashboard/GestaoLideres";
import { GestaoUsuarios } from "@/components/Dashboard/GestaoUsuarios";
import { GestaoClientes } from "@/components/Dashboard/GestaoClientes";
import { GestaoMetas } from "@/components/Dashboard/GestaoMetas";
import { GestaoNotificacoes } from "@/components/Dashboard/GestaoNotificacoes";
import { ResumoMetas } from "@/components/Dashboard/ResumoMetas";
import { ComissoesView } from "@/components/Dashboard/ComissoesView";
import { LancamentoSDRPage } from "@/components/Dashboard/LancamentoSDRPage";
import { ResumoSemanal } from "@/components/Dashboard/ResumoSemanal";
import { ImportExcel } from "@/components/Dashboard/ImportExcel";
import { ExportExcel } from "@/components/Dashboard/ExportExcel";
import { LixeiraLeads } from "@/components/Dashboard/LixeiraLeads";
import { PipelinePage } from "@/components/Pipeline/PipelinePage";
import { useAtendimentos, useClosers, useSdrs, useOrigens, useTimes, useLideres } from "@/hooks/useAtendimentos";
import { useAuth } from "@/hooks/useAuth";
import { useDeletedLeadsCount } from "@/hooks/useLeads";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Headphones, Globe, FileSpreadsheet, Calendar, Shield, Crown, UserCog, Target, Bell, BarChart3, DollarSign, Building2, Trash2, Columns3 } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
const Index = () => {
  const {
    isAdmin,
    isLider,
    isVendedor,
    isSdr,
    isCliente,
    profile
  } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("custom");
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedCloser, setSelectedCloser] = useState<string | null>(null);
  const [selectedSdr, setSelectedSdr] = useState<string | null>(null);
  const {
    data: pipelineData = [],
    isLoading: isLoadingPipeline
  } = usePipelineForDashboard();
  const {
    data: closersData = [],
    isLoading: isLoadingClosers
  } = useClosers();
  const {
    data: sdrsData = [],
    isLoading: isLoadingSdrs
  } = useSdrs();
  const {
    data: origensData = [],
    isLoading: isLoadingOrigens
  } = useOrigens();
  const {
    data: timesData = [],
    isLoading: isLoadingTimes
  } = useTimes();
  const {
    data: lideresData = [],
    isLoading: isLoadingLideres
  } = useLideres();
  const {
    data: allClosers = []
  } = useClosers(true);
  const {
    data: allSdrs = []
  } = useSdrs(true);
  const {
    data: allOrigens = []
  } = useOrigens(true);
  const {
    data: allTimes = []
  } = useTimes(true);
  const {
    data: allLideres = []
  } = useLideres(true);

  // Count of deleted leads for trash badge
  const {
    data: deletedLeadsCount = 0
  } = useDeletedLeadsCount();

  // Determine which team to use based on role
  const effectiveTeamFilter = useMemo(() => {
    // Admin can filter by team
    if (isAdmin) {
      return selectedTeam;
    }
    // Lider can only see their own team
    if (isLider && profile?.time_id) {
      return profile.time_id;
    }
    // Vendedor and SDR only see their team
    if ((isVendedor || isSdr) && profile?.time_id) {
      return profile.time_id;
    }
    return null;
  }, [isAdmin, isLider, isVendedor, isSdr, profile, selectedTeam]);

  // Filter closers and SDRs by team
  const filteredClosers = useMemo(() => {
    let filtered = allClosers;
    if (effectiveTeamFilter) {
      filtered = filtered.filter(c => c.time_id === effectiveTeamFilter);
    }
    if (selectedCloser) {
      filtered = filtered.filter(c => c.id === selectedCloser);
    }
    return filtered;
  }, [allClosers, effectiveTeamFilter, selectedCloser]);
  const filteredSdrs = useMemo(() => {
    let filtered = allSdrs;
    if (effectiveTeamFilter) {
      filtered = filtered.filter(s => s.time_id === effectiveTeamFilter);
    }
    if (selectedSdr) {
      filtered = filtered.filter(s => s.id === selectedSdr);
    }
    return filtered;
  }, [allSdrs, effectiveTeamFilter, selectedSdr]);

  // For Vendedor/SDR: only show their own data
  const filteredPipelineData = useMemo(() => {
    let filtered = pipelineData;

    // Filter by team if applicable
    if (effectiveTeamFilter) {
      const teamCloserNames = allClosers.filter(c => c.time_id === effectiveTeamFilter).map(c => c.nome);
      const teamSdrNames = allSdrs.filter(s => s.time_id === effectiveTeamFilter).map(s => s.nome);
      filtered = filtered.filter(a => teamCloserNames.includes(a.closer_nome || "") || teamSdrNames.includes(a.str_responsavel_nome || a.sdr_nome || ""));
    }

    // Filter by specific closer
    if (selectedCloser) {
      const closerName = allClosers.find(c => c.id === selectedCloser)?.nome;
      if (closerName) {
        filtered = filtered.filter(a => a.closer_nome === closerName);
      }
    }

    // Filter by specific SDR
    if (selectedSdr) {
      const sdrName = allSdrs.find(s => s.id === selectedSdr)?.nome;
      if (sdrName) {
        filtered = filtered.filter(a => a.str_responsavel_nome === sdrName || a.sdr_nome === sdrName);
      }
    }

    // For vendedor: only their own closes
    if (isVendedor && profile?.closer_id) {
      const myCloser = allClosers.find(c => c.id === profile.closer_id);
      if (myCloser) {
        filtered = filtered.filter(a => a.closer_nome === myCloser.nome);
      }
    }

    // For SDR: only their own leads
    if (isSdr && profile?.sdr_id) {
      const mySdr = allSdrs.find(s => s.id === profile.sdr_id);
      if (mySdr) {
        filtered = filtered.filter(a => a.str_responsavel_nome === mySdr.nome || a.sdr_nome === mySdr.nome);
      }
    }
    return filtered;
  }, [pipelineData, effectiveTeamFilter, selectedCloser, selectedSdr, isVendedor, isSdr, profile, allClosers, allSdrs]);
  const closersList = useMemo(() => {
    if (isVendedor && profile?.closer_id) {
      const myCloser = allClosers.find(c => c.id === profile.closer_id);
      return myCloser ? [myCloser.nome] : [];
    }
    return filteredClosers.filter(c => c.ativo).map(c => c.nome);
  }, [filteredClosers, isVendedor, profile, allClosers]);
  const sdrsList = useMemo(() => {
    if (isSdr && profile?.sdr_id) {
      const mySdr = allSdrs.find(s => s.id === profile.sdr_id);
      return mySdr ? [mySdr.nome] : [];
    }
    return filteredSdrs.filter(s => s.ativo).map(s => s.nome);
  }, [filteredSdrs, isSdr, profile, allSdrs]);
  const handlePeriodChange = (start: Date, end: Date, type: PeriodType) => {
    setDateRange({
      start,
      end
    });
    setPeriodType(type);
  };
  const isLoading = isLoadingPipeline || isLoadingClosers || isLoadingSdrs || isLoadingOrigens || isLoadingTimes || isLoadingLideres;

  // Permissões por perfil:
  // - Admin: acesso completo
  // - Cliente: apenas dashboard da operação
  // - Líder: dashboard, resumo, lançamentos, metas (da equipe)
  // - Vendedor/SDR: apenas dashboard e resumo metas (próprios resultados)
  const canSeeDashboard = true;
  const canSeeResumo = isAdmin || isLider;
  const canSeeLancamentos = isAdmin || isLider || isVendedor || isSdr;
  const canSeeMetas = isAdmin;
  const canSeeResumoMetas = !isCliente;
  const canSeeComissoes = !isCliente;
  const canSeeNotificacoes = isAdmin;
  const canSeeGestao = isAdmin;
  const canSeeUsuarios = isAdmin;
  const canSeeClientes = isAdmin;
  const canSeeLixeira = isAdmin;
  const canSeePipeline = isAdmin || isLider || isVendedor || isSdr;

  // Determine if user should see individual dashboard
  const showClienteDashboard = isCliente;
  const showIndividualDashboard = isVendedor && profile?.closer_id || isSdr && profile?.sdr_id;
  const userReferenciaNome = useMemo(() => {
    if (isVendedor && profile?.closer_id) {
      return allClosers.find(c => c.id === profile.closer_id)?.nome || "Usuário";
    }
    if (isSdr && profile?.sdr_id) {
      return allSdrs.find(s => s.id === profile.sdr_id)?.nome || "Usuário";
    }
    return "Usuário";
  }, [isVendedor, isSdr, profile, allClosers, allSdrs]);
  return <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="bg-secondary/50 p-1 h-auto flex flex-wrap gap-1 w-full lg:w-auto">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              {canSeePipeline && <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Columns3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastro de Leads
              </span>
                </TabsTrigger>}
              {canSeeResumo && <TabsTrigger value="resumo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Resumo</span>
                </TabsTrigger>}
              {canSeeLancamentos && <>
                  <TabsTrigger value="lancamentos-sdr" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">Registros SDR</span>
                  </TabsTrigger>
                </>}
              {canSeeGestao && <>
                  <TabsTrigger value="times" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Times</span>
                  </TabsTrigger>
                  <TabsTrigger value="lideres" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Crown className="h-4 w-4" />
                    <span className="hidden sm:inline">Líderes</span>
                  </TabsTrigger>
                  <TabsTrigger value="closers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Closers</span>
                  </TabsTrigger>
                  <TabsTrigger value="sdrs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Headphones className="h-4 w-4" />
                    <span className="hidden sm:inline">SDRs</span>
                  </TabsTrigger>
                  <TabsTrigger value="origens" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Origens</span>
                  </TabsTrigger>
                </>}
              {canSeeClientes && <TabsTrigger value="clientes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clientes</span>
                </TabsTrigger>}
              {canSeeMetas && <TabsTrigger value="metas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Metas</span>
                </TabsTrigger>}
              {canSeeResumoMetas && <TabsTrigger value="resumo-metas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Resumo</span>
                </TabsTrigger>}
              {canSeeComissoes && <TabsTrigger value="comissoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Comissões</span>
                </TabsTrigger>}
              {canSeeNotificacoes && <TabsTrigger value="notificacoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notif.</span>
                </TabsTrigger>}
              {canSeeUsuarios && <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <UserCog className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </TabsTrigger>}
              {canSeeLixeira && <TabsTrigger value="lixeira" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 relative">
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Lixeira</span>
                  {deletedLeadsCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {deletedLeadsCount > 9 ? "9+" : deletedLeadsCount}
                    </Badge>}
                </TabsTrigger>}
            </TabsList>
            
            <div className="flex gap-2 flex-wrap">
              {(isAdmin || isLider) && <>
                  <ImportExcel />
                  <ExportExcel />
                </>}
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {showIndividualDashboard ? "Meus Resultados" : "Dashboard de Resultados"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {format(dateRange.start, "dd 'de' MMMM", {
                  locale: ptBR
                })} - {format(dateRange.end, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR
                })}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {(isAdmin || isLider) && <AdvancedFilters times={allTimes} closers={allClosers} sdrs={allSdrs} selectedTeam={selectedTeam} selectedCloser={selectedCloser} selectedSdr={selectedSdr} onTeamChange={setSelectedTeam} onCloserChange={setSelectedCloser} onSdrChange={setSelectedSdr} />}
                <PeriodFilter onPeriodChange={handlePeriodChange} currentPeriod={periodType} />
              </div>
            </div>
            
            {showClienteDashboard ? <ClienteDashboard /> : showIndividualDashboard ? <MeuDashboard pipelineData={filteredPipelineData} tipo={isVendedor ? "closer" : "sdr"} referenciaId={(isVendedor ? profile?.closer_id : profile?.sdr_id) || ""} referenciaNome={userReferenciaNome} dateRange={dateRange} /> : <DashboardContent pipelineData={filteredPipelineData} closersList={closersList} sdrsList={sdrsList} dateRange={dateRange} isLoading={isLoading} times={allTimes} closers={filteredClosers} sdrs={filteredSdrs} />}
          </TabsContent>

          {canSeePipeline && <TabsContent value="pipeline" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Pipeline Comercial</h2>
                <p className="text-sm text-muted-foreground">Gerencie seus leads e negociações</p>
              </div>
              <PipelinePage />
            </TabsContent>}

          {canSeeResumo && <TabsContent value="resumo" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Resumo Semanal</h2>
                <p className="text-sm text-muted-foreground">Visão consolidada por período</p>
              </div>
              <ResumoSemanal />
            </TabsContent>}


          {canSeeLancamentos && <>
              <TabsContent value="lancamentos-sdr" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Lançamentos SDR</h2>
                  <p className="text-sm text-muted-foreground">Registre as atividades diárias dos SDRs</p>
                </div>
                <LancamentoSDRPage />
              </TabsContent>

            </>}

          {canSeeGestao && <>
              <TabsContent value="times" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Times</h2>
                  <p className="text-sm text-muted-foreground">Gerencie os times da equipe comercial</p>
                </div>
                <GestaoTimes times={allTimes} />
              </TabsContent>

              <TabsContent value="lideres" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Líderes Comerciais</h2>
                  <p className="text-sm text-muted-foreground">Gerencie os líderes de cada time</p>
                </div>
                <GestaoLideres lideres={allLideres} times={allTimes} />
              </TabsContent>

              <TabsContent value="closers" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Closers</h2>
                  <p className="text-sm text-muted-foreground">Gerencie os closers da equipe</p>
                </div>
                <GestaoClosers closers={allClosers} times={allTimes} />
              </TabsContent>

              <TabsContent value="sdrs" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">SDRs</h2>
                  <p className="text-sm text-muted-foreground">Gerencie os SDRs da equipe</p>
                </div>
                <GestaoSDRs sdrs={allSdrs} times={allTimes} />
              </TabsContent>

              <TabsContent value="origens" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Origens</h2>
                  <p className="text-sm text-muted-foreground">Gerencie as origens de leads</p>
                </div>
                <GestaoOrigens origens={allOrigens} />
              </TabsContent>
            </>}

          {canSeeClientes && <TabsContent value="clientes" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Clientes/Contratantes</h2>
                <p className="text-sm text-muted-foreground">Gerencie os clientes que contratam operações</p>
              </div>
              <GestaoClientes />
            </TabsContent>}

          {canSeeMetas && <TabsContent value="metas" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Metas Mensais</h2>
                <p className="text-sm text-muted-foreground">Defina e acompanhe as metas de cada closer e SDR</p>
              </div>
              <GestaoMetas times={allTimes} />
            </TabsContent>}

          {canSeeResumoMetas && <TabsContent value="resumo-metas" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {isVendedor || isSdr ? "Minhas Metas" : "Resumo de Metas"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isVendedor || isSdr ? "Acompanhe seu progresso em relação às suas metas" : "Acompanhe quantos closers e SDRs estão próximos de bater suas metas"}
                </p>
              </div>
              <ResumoMetas teamFilter={effectiveTeamFilter} userCloserId={isVendedor ? profile?.closer_id : undefined} userSdrId={isSdr ? profile?.sdr_id : undefined} />
            </TabsContent>}

          {canSeeComissoes && <TabsContent value="comissoes" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {isVendedor || isSdr ? "Minha Comissão" : "Comissões"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isVendedor || isSdr ? "Acompanhe sua previsão de comissão" : "Visualize as comissões de toda a equipe"}
                </p>
              </div>
              <ComissoesView />
            </TabsContent>}

          {canSeeNotificacoes && <TabsContent value="notificacoes" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Notificações</h2>
                <p className="text-sm text-muted-foreground">Configure alertas por email para metas e performance</p>
              </div>
              <GestaoNotificacoes />
            </TabsContent>}

          {canSeeUsuarios && <TabsContent value="usuarios" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Usuários</h2>
                <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
              </div>
              <GestaoUsuarios />
            </TabsContent>}

          {canSeeLixeira && <TabsContent value="lixeira" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Lixeira de Leads</h2>
                <p className="text-sm text-muted-foreground">Restaure ou exclua permanentemente os leads removidos</p>
              </div>
              <LixeiraLeads />
            </TabsContent>}
        </Tabs>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>CX - Comercial 10X © {new Date().getFullYear()} • Dashboard de Resultados</p>
        </div>
      </footer>
    </div>;
};
export default Index;