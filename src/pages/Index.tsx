import { useState, useMemo } from "react";
import { Header } from "@/components/Dashboard/Header";
import { PeriodFilter, PeriodType } from "@/components/Dashboard/PeriodFilter";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import { AtendimentoForm } from "@/components/Dashboard/AtendimentoForm";
import { GestaoClosers } from "@/components/Dashboard/GestaoClosers";
import { GestaoSDRs } from "@/components/Dashboard/GestaoSDRs";
import { GestaoOrigens } from "@/components/Dashboard/GestaoOrigens";
import { useAtendimentos, useClosers, useSdrs, useOrigens } from "@/hooks/useAtendimentos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, PlusCircle, Users, Headphones, Globe } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useAtendimentos();
  const { data: closersData = [], isLoading: isLoadingClosers } = useClosers();
  const { data: sdrsData = [], isLoading: isLoadingSdrs } = useSdrs();
  const { data: origensData = [], isLoading: isLoadingOrigens } = useOrigens();
  
  // Para gestão (inclui inativos)
  const { data: allClosers = [] } = useClosers(true);
  const { data: allSdrs = [] } = useSdrs(true);
  const { data: allOrigens = [] } = useOrigens(true);

  const closersList = useMemo(() => closersData.map(c => c.nome), [closersData]);

  const handlePeriodChange = (start: Date, end: Date, type: PeriodType) => {
    setDateRange({ start, end });
    setPeriodType(type);
  };

  const isLoading = isLoadingAtendimentos || isLoadingClosers || isLoadingSdrs || isLoadingOrigens;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Navegação em Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="cadastrar"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Cadastrar
            </TabsTrigger>
            <TabsTrigger 
              value="closers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <Users className="h-4 w-4" />
              Closers
            </TabsTrigger>
            <TabsTrigger 
              value="sdrs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <Headphones className="h-4 w-4" />
              SDRs
            </TabsTrigger>
            <TabsTrigger 
              value="origens"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <Globe className="h-4 w-4" />
              Origens
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Título e Filtros */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

            <DashboardContent 
              atendimentos={atendimentos}
              closersList={closersList}
              dateRange={dateRange}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Cadastrar Tab */}
          <TabsContent value="cadastrar" className="space-y-6">
            <div className="opacity-0 animate-fade-in">
              <h2 className="font-display text-3xl font-bold text-foreground">
                Cadastrar Atendimento
              </h2>
              <p className="text-muted-foreground">
                Registre um novo atendimento no sistema
              </p>
            </div>

            <AtendimentoForm 
              closers={closersData}
              sdrs={sdrsData}
              origens={origensData}
              onSuccess={() => setActiveTab("dashboard")}
            />
          </TabsContent>

          {/* Closers Tab */}
          <TabsContent value="closers" className="space-y-6">
            <div className="opacity-0 animate-fade-in">
              <h2 className="font-display text-3xl font-bold text-foreground">
                Closers
              </h2>
              <p className="text-muted-foreground">
                Gerencie os closers da equipe
              </p>
            </div>

            <GestaoClosers closers={allClosers} />
          </TabsContent>

          {/* SDRs Tab */}
          <TabsContent value="sdrs" className="space-y-6">
            <div className="opacity-0 animate-fade-in">
              <h2 className="font-display text-3xl font-bold text-foreground">
                SDRs
              </h2>
              <p className="text-muted-foreground">
                Gerencie os SDRs da equipe
              </p>
            </div>

            <GestaoSDRs sdrs={allSdrs} />
          </TabsContent>

          {/* Origens Tab */}
          <TabsContent value="origens" className="space-y-6">
            <div className="opacity-0 animate-fade-in">
              <h2 className="font-display text-3xl font-bold text-foreground">
                Origens
              </h2>
              <p className="text-muted-foreground">
                Gerencie as origens de leads
              </p>
            </div>

            <GestaoOrigens origens={allOrigens} />
          </TabsContent>
        </Tabs>
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
