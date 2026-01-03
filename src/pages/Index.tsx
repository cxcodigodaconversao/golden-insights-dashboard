import { useState, useMemo } from "react";
import { Header } from "@/components/Dashboard/Header";
import { PeriodFilter, PeriodType } from "@/components/Dashboard/PeriodFilter";
import { TeamFilter } from "@/components/Dashboard/TeamFilter";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import { AtendimentoForm } from "@/components/Dashboard/AtendimentoForm";
import { GestaoClosers } from "@/components/Dashboard/GestaoClosers";
import { GestaoSDRs } from "@/components/Dashboard/GestaoSDRs";
import { GestaoOrigens } from "@/components/Dashboard/GestaoOrigens";
import { GestaoTimes } from "@/components/Dashboard/GestaoTimes";
import { GestaoLideres } from "@/components/Dashboard/GestaoLideres";
import { GestaoUsuarios } from "@/components/Dashboard/GestaoUsuarios";
import { GestaoMetas } from "@/components/Dashboard/GestaoMetas";
import { GestaoNotificacoes } from "@/components/Dashboard/GestaoNotificacoes";
import { LancamentoSDRPage } from "@/components/Dashboard/LancamentoSDRPage";
import { LancamentoDisparoPage } from "@/components/Dashboard/LancamentoDisparoPage";
import { LancamentoTrafegoPage } from "@/components/Dashboard/LancamentoTrafegoPage";
import { ResumoSemanal } from "@/components/Dashboard/ResumoSemanal";
import { ImportExcel } from "@/components/Dashboard/ImportExcel";
import { ExportExcel } from "@/components/Dashboard/ExportExcel";
import { useAtendimentos, useClosers, useSdrs, useOrigens, useTimes, useLideres } from "@/hooks/useAtendimentos";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, Users, Headphones, Globe, FileSpreadsheet, Zap, TrendingUp, Calendar, Shield, Crown, UserCog, Target, Bell } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const { isAdmin, isLider, isVendedor, isSdr, profile } = useAuth();
  const [periodType, setPeriodType] = useState<PeriodType>("custom");
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useAtendimentos();
  const { data: closersData = [], isLoading: isLoadingClosers } = useClosers();
  const { data: sdrsData = [], isLoading: isLoadingSdrs } = useSdrs();
  const { data: origensData = [], isLoading: isLoadingOrigens } = useOrigens();
  const { data: timesData = [], isLoading: isLoadingTimes } = useTimes();
  const { data: lideresData = [], isLoading: isLoadingLideres } = useLideres();
  
  const { data: allClosers = [] } = useClosers(true);
  const { data: allSdrs = [] } = useSdrs(true);
  const { data: allOrigens = [] } = useOrigens(true);
  const { data: allTimes = [] } = useTimes(true);
  const { data: allLideres = [] } = useLideres(true);

  // Determine which team to use based on role
  const effectiveTeamFilter = useMemo(() => {
    // Admin and Lider can filter by team
    if (isAdmin || isLider) {
      // Lider can only see their own team
      if (isLider && profile?.time_id) {
        return profile.time_id;
      }
      return selectedTeam;
    }
    // Vendedor and SDR only see their team
    if ((isVendedor || isSdr) && profile?.time_id) {
      return profile.time_id;
    }
    return null;
  }, [isAdmin, isLider, isVendedor, isSdr, profile, selectedTeam]);

  // Filter closers and SDRs by team
  const filteredClosers = useMemo(() => {
    if (!effectiveTeamFilter) return allClosers;
    return allClosers.filter(c => c.time_id === effectiveTeamFilter);
  }, [allClosers, effectiveTeamFilter]);

  const filteredSdrs = useMemo(() => {
    if (!effectiveTeamFilter) return allSdrs;
    return allSdrs.filter(s => s.time_id === effectiveTeamFilter);
  }, [allSdrs, effectiveTeamFilter]);

  // For Vendedor/SDR: only show their own data
  const filteredAtendimentos = useMemo(() => {
    let filtered = atendimentos;
    
    // Filter by team if applicable
    if (effectiveTeamFilter) {
      const teamCloserNames = filteredClosers.map(c => c.nome);
      const teamSdrNames = filteredSdrs.map(s => s.nome);
      filtered = filtered.filter(a => 
        teamCloserNames.includes(a.closer) || teamSdrNames.includes(a.sdr)
      );
    }

    // For vendedor: only their own closes
    if (isVendedor && profile?.closer_id) {
      const myCloser = allClosers.find(c => c.id === profile.closer_id);
      if (myCloser) {
        filtered = filtered.filter(a => a.closer === myCloser.nome);
      }
    }

    // For SDR: only their own leads
    if (isSdr && profile?.sdr_id) {
      const mySdr = allSdrs.find(s => s.id === profile.sdr_id);
      if (mySdr) {
        filtered = filtered.filter(a => a.sdr === mySdr.nome);
      }
    }

    return filtered;
  }, [atendimentos, effectiveTeamFilter, filteredClosers, filteredSdrs, isVendedor, isSdr, profile, allClosers, allSdrs]);

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
    setDateRange({ start, end });
    setPeriodType(type);
  };

  const isLoading = isLoadingAtendimentos || isLoadingClosers || isLoadingSdrs || isLoadingOrigens || isLoadingTimes || isLoadingLideres;

  const canSeeDashboard = true;
  const canSeeResumo = isAdmin || isLider;
  const canSeeCadastrar = isAdmin || isLider;
  const canSeeLancamentos = isAdmin || isLider;
  const canSeeMetas = isAdmin || isLider;
  const canSeeNotificacoes = isAdmin;
  const canSeeGestao = isAdmin;
  const canSeeUsuarios = isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="bg-secondary/50 p-1 h-auto flex flex-wrap gap-1 w-full lg:w-auto">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              {canSeeResumo && (
                <TabsTrigger value="resumo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Calendar className="h-4 w-4" />
                  Resumo
                </TabsTrigger>
              )}
              {canSeeCadastrar && (
                <TabsTrigger value="cadastrar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Cadastrar
                </TabsTrigger>
              )}
              {canSeeLancamentos && (
                <>
                  <TabsTrigger value="lancamentos-sdr" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    SDR
                  </TabsTrigger>
                  <TabsTrigger value="disparo" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Zap className="h-4 w-4" />
                    Disparo
                  </TabsTrigger>
                  <TabsTrigger value="trafego" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tráfego
                  </TabsTrigger>
                </>
              )}
              {canSeeGestao && (
                <>
                  <TabsTrigger value="times" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Shield className="h-4 w-4" />
                    Times
                  </TabsTrigger>
                  <TabsTrigger value="lideres" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Crown className="h-4 w-4" />
                    Líderes
                  </TabsTrigger>
                  <TabsTrigger value="closers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Users className="h-4 w-4" />
                    Closers
                  </TabsTrigger>
                  <TabsTrigger value="sdrs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Headphones className="h-4 w-4" />
                    SDRs
                  </TabsTrigger>
                  <TabsTrigger value="origens" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                    <Globe className="h-4 w-4" />
                    Origens
                  </TabsTrigger>
                </>
              )}
              {canSeeMetas && (
                <TabsTrigger value="metas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Target className="h-4 w-4" />
                  Metas
                </TabsTrigger>
              )}
              {canSeeNotificacoes && (
                <TabsTrigger value="notificacoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </TabsTrigger>
              )}
              {canSeeUsuarios && (
                <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                  <UserCog className="h-4 w-4" />
                  Usuários
                </TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex gap-2 flex-wrap">
              {isAdmin && (
                <TeamFilter 
                  times={allTimes} 
                  selectedTeam={selectedTeam} 
                  onTeamChange={setSelectedTeam} 
                />
              )}
              {(isAdmin || isLider) && (
                <>
                  <ImportExcel />
                  <ExportExcel />
                </>
              )}
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {isVendedor && "Meus Resultados"}
                  {isSdr && "Meus Resultados"}
                  {(isAdmin || isLider) && "Dashboard de Resultados"}
                  {!isVendedor && !isSdr && !isAdmin && !isLider && "Dashboard"}
                </h2>
                <p className="text-muted-foreground">
                  {format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} - {format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <PeriodFilter onPeriodChange={handlePeriodChange} currentPeriod={periodType} />
            </div>
            <DashboardContent 
              atendimentos={filteredAtendimentos} 
              closersList={closersList} 
              sdrsList={sdrsList} 
              dateRange={dateRange} 
              isLoading={isLoading}
              times={allTimes}
              closers={filteredClosers}
              sdrs={filteredSdrs}
            />
          </TabsContent>

          {canSeeResumo && (
            <TabsContent value="resumo" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-3xl font-bold text-foreground">Resumo Semanal</h2>
                <p className="text-muted-foreground">Visão consolidada por período</p>
              </div>
              <ResumoSemanal />
            </TabsContent>
          )}

          {canSeeCadastrar && (
            <TabsContent value="cadastrar" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-3xl font-bold text-foreground">Cadastrar Atendimento</h2>
                <p className="text-muted-foreground">Registre um novo atendimento no sistema</p>
              </div>
              <AtendimentoForm closers={closersData} sdrs={sdrsData} origens={origensData} onSuccess={() => setActiveTab("dashboard")} />
            </TabsContent>
          )}

          {canSeeLancamentos && (
            <>
              <TabsContent value="lancamentos-sdr" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Lançamentos SDR</h2>
                  <p className="text-muted-foreground">Registre as atividades diárias dos SDRs</p>
                </div>
                <LancamentoSDRPage />
              </TabsContent>

              <TabsContent value="disparo" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Disparo (DC + Isca Digital)</h2>
                  <p className="text-muted-foreground">Lançamentos e vendas de disparo</p>
                </div>
                <LancamentoDisparoPage />
              </TabsContent>

              <TabsContent value="trafego" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Tráfego (SS + Mic + Wpp)</h2>
                  <p className="text-muted-foreground">Lançamentos e vendas de tráfego</p>
                </div>
                <LancamentoTrafegoPage />
              </TabsContent>
            </>
          )}

          {canSeeGestao && (
            <>
              <TabsContent value="times" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Times</h2>
                  <p className="text-muted-foreground">Gerencie os times da equipe comercial</p>
                </div>
                <GestaoTimes times={allTimes} />
              </TabsContent>

              <TabsContent value="lideres" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Líderes Comerciais</h2>
                  <p className="text-muted-foreground">Gerencie os líderes de cada time</p>
                </div>
                <GestaoLideres lideres={allLideres} times={allTimes} />
              </TabsContent>

              <TabsContent value="closers" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Closers</h2>
                  <p className="text-muted-foreground">Gerencie os closers da equipe</p>
                </div>
                <GestaoClosers closers={allClosers} times={allTimes} />
              </TabsContent>

              <TabsContent value="sdrs" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">SDRs</h2>
                  <p className="text-muted-foreground">Gerencie os SDRs da equipe</p>
                </div>
                <GestaoSDRs sdrs={allSdrs} times={allTimes} />
              </TabsContent>

              <TabsContent value="origens" className="space-y-6">
                <div className="opacity-0 animate-fade-in">
                  <h2 className="font-display text-3xl font-bold text-foreground">Origens</h2>
                  <p className="text-muted-foreground">Gerencie as origens de leads</p>
                </div>
                <GestaoOrigens origens={allOrigens} />
              </TabsContent>
            </>
          )}

          {canSeeMetas && (
            <TabsContent value="metas" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-3xl font-bold text-foreground">Metas Mensais</h2>
                <p className="text-muted-foreground">Defina e acompanhe as metas de cada closer e SDR</p>
              </div>
              <GestaoMetas times={allTimes} />
            </TabsContent>
          )}

          {canSeeNotificacoes && (
            <TabsContent value="notificacoes" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-3xl font-bold text-foreground">Notificações</h2>
                <p className="text-muted-foreground">Configure alertas por email para metas e performance</p>
              </div>
              <GestaoNotificacoes />
            </TabsContent>
          )}

          {canSeeUsuarios && (
            <TabsContent value="usuarios" className="space-y-6">
              <div className="opacity-0 animate-fade-in">
                <h2 className="font-display text-3xl font-bold text-foreground">Usuários</h2>
                <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
              </div>
              <GestaoUsuarios />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>CX - Comercial 10X © {new Date().getFullYear()} • Dashboard de Resultados</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
