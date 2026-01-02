import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Calendar as CalendarWeek, TrendingUp, Zap, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  useLancamentosDisparo,
  useLancamentosTrafego,
  useLancamentosSDR,
  calcularMetricasLancamento,
  calcularMetricasSDR,
} from "@/hooks/useLancamentos";
import { useClosers, useSdrs } from "@/hooks/useAtendimentos";

export function ResumoSemanal() {
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { locale: ptBR }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date(), { locale: ptBR }));

  const { data: lancamentosDisparo = [] } = useLancamentosDisparo(startDate, endDate);
  const { data: lancamentosTrafego = [] } = useLancamentosTrafego(startDate, endDate);
  const { data: lancamentosSDR = [] } = useLancamentosSDR(startDate, endDate);
  const { data: closers = [] } = useClosers();
  const { data: sdrs = [] } = useSdrs();

  const metricasDisparo = useMemo(() => calcularMetricasLancamento(lancamentosDisparo), [lancamentosDisparo]);
  const metricasTrafego = useMemo(() => calcularMetricasLancamento(lancamentosTrafego), [lancamentosTrafego]);
  const metricasSDR = useMemo(() => calcularMetricasSDR(lancamentosSDR), [lancamentosSDR]);

  // Totais consolidados
  const totais = useMemo(() => ({
    abordados: metricasDisparo.abordados + metricasTrafego.abordados,
    agendados: metricasDisparo.agendados + metricasTrafego.agendados,
    confirmados: metricasDisparo.confirmados + metricasTrafego.confirmados,
    compareceram: metricasDisparo.compareceram + metricasTrafego.compareceram,
    vendas: metricasDisparo.vendas + metricasTrafego.vendas,
    receita: metricasDisparo.receita + metricasTrafego.receita,
  }), [metricasDisparo, metricasTrafego]);

  // Ranking de closers por origem
  const rankingClosers = useMemo(() => {
    const closerStats: Record<string, { nome: string; disparo: any; trafego: any }> = {};

    closers.forEach((closer) => {
      const disparoData = lancamentosDisparo.filter((l) => l.closer_id === closer.id);
      const trafegoData = lancamentosTrafego.filter((l) => l.closer_id === closer.id);

      if (disparoData.length > 0 || trafegoData.length > 0) {
        closerStats[closer.id] = {
          nome: closer.nome,
          disparo: calcularMetricasLancamento(disparoData),
          trafego: calcularMetricasLancamento(trafegoData),
        };
      }
    });

    return Object.values(closerStats).sort(
      (a, b) => (b.disparo.receita + b.trafego.receita) - (a.disparo.receita + a.trafego.receita)
    );
  }, [closers, lancamentosDisparo, lancamentosTrafego]);

  // Ranking SDRs
  const rankingSDRs = useMemo(() => {
    const sdrStats: Record<string, { nome: string; metricas: any }> = {};

    sdrs.forEach((sdr) => {
      const sdrData = lancamentosSDR.filter((l) => l.sdr_id === sdr.id);
      if (sdrData.length > 0) {
        sdrStats[sdr.id] = {
          nome: sdr.nome,
          metricas: calcularMetricasSDR(sdrData),
        };
      }
    });

    return Object.values(sdrStats).sort((a, b) => b.metricas.agendamentos - a.metricas.agendamentos);
  }, [sdrs, lancamentosSDR]);

  // Chart data
  const chartDataReceita = useMemo(() => [
    { name: "Disparo", receita: metricasDisparo.receita, fill: "hsl(var(--primary))" },
    { name: "Tráfego", receita: metricasTrafego.receita, fill: "hsl(var(--success))" },
  ], [metricasDisparo, metricasTrafego]);

  const chartDataConversao = useMemo(() => [
    { name: "Disparo", "% Fechamento": metricasDisparo.percentVendasCompareceram },
    { name: "Tráfego", "% Fechamento": metricasTrafego.percentVendasCompareceram },
  ], [metricasDisparo, metricasTrafego]);

  const handleSetThisWeek = () => {
    setStartDate(startOfWeek(new Date(), { locale: ptBR }));
    setEndDate(endOfWeek(new Date(), { locale: ptBR }));
  };

  const handleSetThisMonth = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(startDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {format(endDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleSetThisWeek}>
                Esta Semana
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSetThisMonth}>
                Este Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Abordados</p>
            <p className="text-2xl font-bold">{totais.abordados}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Agendados</p>
            <p className="text-2xl font-bold">{totais.agendados}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Compareceram</p>
            <p className="text-2xl font-bold">{totais.compareceram}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Vendas</p>
            <p className="text-2xl font-bold text-success">{totais.vendas}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">% Comparecimento</p>
            <p className="text-2xl font-bold text-primary">
              {totais.agendados > 0 ? ((totais.compareceram / totais.agendados) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold text-success">
              {totais.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics by Origin */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disparo Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Zap className="h-5 w-5 text-primary" />
              Disparo (DC + Isca Digital)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Agendados</p>
                <p className="text-xl font-bold">{metricasDisparo.agendados}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confirmados</p>
                <p className="text-xl font-bold">{metricasDisparo.confirmados}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compareceram</p>
                <p className="text-xl font-bold">{metricasDisparo.compareceram}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas</p>
                <p className="text-xl font-bold text-success">{metricasDisparo.vendas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% Comparecimento</p>
                <p className="text-xl font-bold text-primary">{metricasDisparo.percentComparecimento.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% Fechamento</p>
                <p className="text-xl font-bold text-primary">{metricasDisparo.percentVendasCompareceram.toFixed(1)}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-success">
                  {metricasDisparo.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tráfego Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-success" />
              Tráfego (SS + Mic + Wpp)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Agendados</p>
                <p className="text-xl font-bold">{metricasTrafego.agendados}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confirmados</p>
                <p className="text-xl font-bold">{metricasTrafego.confirmados}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compareceram</p>
                <p className="text-xl font-bold">{metricasTrafego.compareceram}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas</p>
                <p className="text-xl font-bold text-success">{metricasTrafego.vendas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% Comparecimento</p>
                <p className="text-xl font-bold text-primary">{metricasTrafego.percentComparecimento.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">% Fechamento</p>
                <p className="text-xl font-bold text-primary">{metricasTrafego.percentVendasCompareceram.toFixed(1)}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold text-success">
                  {metricasTrafego.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SDR Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Resumo SDRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div>
              <p className="text-xs text-muted-foreground">Total Abordados</p>
              <p className="text-xl font-bold">{metricasSDR.abordados}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Responderam</p>
              <p className="text-xl font-bold">{metricasSDR.responderam}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">% Responderam</p>
              <p className="text-xl font-bold text-primary">{metricasSDR.percentResponderam.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Agendamentos</p>
              <p className="text-xl font-bold">{metricasSDR.agendamentos}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">% Agendamentos</p>
              <p className="text-xl font-bold text-primary">{metricasSDR.percentAgendamentos.toFixed(1)}%</p>
            </div>
          </div>

          {rankingSDRs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SDR</TableHead>
                  <TableHead className="text-right">Abordados</TableHead>
                  <TableHead className="text-right">Responderam</TableHead>
                  <TableHead className="text-right">% Resp.</TableHead>
                  <TableHead className="text-right">Agendamentos</TableHead>
                  <TableHead className="text-right">% Agend.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingSDRs.map((sdr) => (
                  <TableRow key={sdr.nome}>
                    <TableCell className="font-medium">{sdr.nome}</TableCell>
                    <TableCell className="text-right">{sdr.metricas.abordados}</TableCell>
                    <TableCell className="text-right">{sdr.metricas.responderam}</TableCell>
                    <TableCell className="text-right text-primary">{sdr.metricas.percentResponderam.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{sdr.metricas.agendamentos}</TableCell>
                    <TableCell className="text-right text-primary">{sdr.metricas.percentAgendamentos.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Closer Ranking */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Ranking Closers por Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2}>Closer</TableHead>
                  <TableHead colSpan={4} className="text-center border-l border-border">Disparo</TableHead>
                  <TableHead colSpan={4} className="text-center border-l border-border">Tráfego</TableHead>
                  <TableHead className="text-right border-l border-border">Total</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-right border-l border-border">Comp.</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right border-l border-border">Comp.</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right border-l border-border">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingClosers.map((closer) => (
                  <TableRow key={closer.nome}>
                    <TableCell className="font-medium">{closer.nome}</TableCell>
                    <TableCell className="text-right border-l border-border">{closer.disparo.compareceram}</TableCell>
                    <TableCell className="text-right">{closer.disparo.vendas}</TableCell>
                    <TableCell className="text-right text-primary">{closer.disparo.percentVendasCompareceram.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      {closer.disparo.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right border-l border-border">{closer.trafego.compareceram}</TableCell>
                    <TableCell className="text-right">{closer.trafego.vendas}</TableCell>
                    <TableCell className="text-right text-primary">{closer.trafego.percentVendasCompareceram.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">
                      {closer.trafego.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                    <TableCell className="text-right border-l border-border font-bold text-success">
                      {(closer.disparo.receita + closer.trafego.receita).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Receita por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataReceita}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">% Fechamento por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataConversao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="% Fechamento" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
