import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Award, Users, Headphones, Gift, Download, FileSpreadsheet } from "lucide-react";
import { useMetas, Meta } from "@/hooks/useMetas";
import { useClosers, useSdrs, useAtendimentos, useTimes } from "@/hooks/useAtendimentos";
import { useLancamentosSDR, useLancamentosDisparo, useLancamentosTrafego } from "@/hooks/useLancamentos";
import { format, startOfMonth, endOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ComissaoItem {
  id: string;
  nome: string;
  tipo: "closer" | "sdr";
  timeId: string | null;
  timeNome?: string;
  receita: number;
  vendas: number;
  meta: Meta | null;
  comissaoBase: number;
  bonus: number;
  comissaoTotal: number;
  progresso: number;
  origemComissao: "Meta" | "Cadastro";
  comissaoPercentualAplicada: number;
}

export function ComissoesView() {
  const { isAdmin, isLider, isVendedor, isSdr, profile } = useAuth();
  
  const [selectedMonth, setSelectedMonth] = useState(() => 
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [isExporting, setIsExporting] = useState(false);

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

  // Filter based on user role
  const filteredClosers = useMemo(() => {
    if (isVendedor && profile?.closer_id) {
      return closers.filter(c => c.id === profile.closer_id);
    }
    if (isLider && profile?.time_id) {
      return closers.filter(c => c.time_id === profile.time_id);
    }
    return closers;
  }, [closers, isVendedor, isLider, profile]);

  const filteredSdrs = useMemo(() => {
    if (isSdr && profile?.sdr_id) {
      return sdrs.filter(s => s.id === profile.sdr_id);
    }
    if (isLider && profile?.time_id) {
      return sdrs.filter(s => s.time_id === profile.time_id);
    }
    return sdrs;
  }, [sdrs, isSdr, isLider, profile]);

  // Calculate commissions for all users
  const comissoes = useMemo(() => {
    const items: ComissaoItem[] = [];

    // Process Closers
    filteredClosers.forEach(closer => {
      const meta = metas.find(m => m.tipo === "closer" && m.referencia_id === closer.id);
      const time = times.find(t => t.id === closer.time_id);

      // Calculate realized values
      const closerAtendimentos = atendimentos.filter(a => {
        const date = new Date(a.data_call);
        return a.closer === closer.nome && 
               date >= monthStart && 
               date <= monthEnd &&
               (a.status === "Venda Confirmada" || a.status === "Ganho");
      });

      const receitaAtendimentos = closerAtendimentos.reduce((sum, a) => sum + (a.valor || 0), 0);
      const vendasAtendimentos = closerAtendimentos.length;

      // Add lancamentos data
      const closerLancamentosDisparo = lancamentosDisparo.filter(l => {
        const date = parseISO(l.data);
        return l.closer_id === closer.id && date >= monthStart && date <= monthEnd;
      });

      const closerLancamentosTrafego = lancamentosTrafego.filter(l => {
        const date = parseISO(l.data);
        return l.closer_id === closer.id && date >= monthStart && date <= monthEnd;
      });

      const receitaDisparo = closerLancamentosDisparo.reduce((sum, l) => sum + Number(l.receita || 0), 0);
      const receitaTrafego = closerLancamentosTrafego.reduce((sum, l) => sum + Number(l.receita || 0), 0);
      const vendasDisparo = closerLancamentosDisparo.reduce((sum, l) => sum + (l.vendas || 0), 0);
      const vendasTrafego = closerLancamentosTrafego.reduce((sum, l) => sum + (l.vendas || 0), 0);

      const receita = receitaAtendimentos + receitaDisparo + receitaTrafego;
      const vendas = vendasAtendimentos + vendasDisparo + vendasTrafego;

      // Priority: Meta > Cadastro
      const comissaoPercentual = meta?.comissao_percentual ?? closer.comissao_percentual ?? 0;
      const origemComissao: "Meta" | "Cadastro" = meta?.comissao_percentual ? "Meta" : "Cadastro";
      
      const comissaoBase = receita * (comissaoPercentual / 100);
      const metaReceita = meta?.meta_receita || 0;
      const progresso = metaReceita > 0 ? (receita / metaReceita) * 100 : 0;
      
      // Bonus: from Meta if achieved, otherwise from Cadastro if achieved
      const bonusMeta = meta?.bonus_extra ?? 0;
      const bonusCadastro = closer.bonus_extra ?? 0;
      const bonus = progresso >= 100 ? (bonusMeta > 0 ? bonusMeta : bonusCadastro) : 0;

      items.push({
        id: closer.id,
        nome: closer.nome,
        tipo: "closer",
        timeId: closer.time_id,
        timeNome: time?.nome,
        receita,
        vendas,
        meta,
        comissaoBase,
        bonus,
        comissaoTotal: comissaoBase + bonus,
        progresso,
        origemComissao,
        comissaoPercentualAplicada: comissaoPercentual,
      });
    });

    // Process SDRs
    filteredSdrs.forEach(sdr => {
      const meta = metas.find(m => m.tipo === "sdr" && m.referencia_id === sdr.id);
      const time = times.find(t => t.id === sdr.time_id);

      // Calculate realized values from lancamentos_sdr
      const sdrLancamentos = lancamentosSdr.filter(l => {
        const date = parseISO(l.data);
        return l.sdr_id === sdr.id && date >= monthStart && date <= monthEnd;
      });

      const vendas = sdrLancamentos.reduce((sum, l) => sum + (l.vendas_agendamentos || 0), 0);
      const agendamentos = sdrLancamentos.reduce((sum, l) => sum + (l.agendamentos || 0), 0);

      // Priority: Meta > Cadastro
      const comissaoPercentual = meta?.comissao_percentual ?? sdr.comissao_percentual ?? 0;
      const origemComissao: "Meta" | "Cadastro" = meta?.comissao_percentual ? "Meta" : "Cadastro";
      
      const metaVendas = meta?.meta_vendas || 0;
      const metaAgendamentos = meta?.meta_agendamentos || 0;
      
      // Calculate a pseudo-revenue for SDRs based on their performance
      const receita = vendas * 1000; // Placeholder: R$1000 per sale attribution
      const comissaoBase = receita * (comissaoPercentual / 100);
      
      const progressoVendas = metaVendas > 0 ? (vendas / metaVendas) * 100 : 0;
      const progressoAgend = metaAgendamentos > 0 ? (agendamentos / metaAgendamentos) * 100 : 0;
      const progresso = Math.max(progressoVendas, progressoAgend);
      
      // Bonus: from Meta if achieved, otherwise from Cadastro if achieved
      const bonusMeta = meta?.bonus_extra ?? 0;
      const bonusCadastro = sdr.bonus_extra ?? 0;
      const bonus = progresso >= 100 ? (bonusMeta > 0 ? bonusMeta : bonusCadastro) : 0;

      items.push({
        id: sdr.id,
        nome: sdr.nome,
        tipo: "sdr",
        timeId: sdr.time_id,
        timeNome: time?.nome,
        receita,
        vendas,
        meta,
        comissaoBase,
        bonus,
        comissaoTotal: comissaoBase + bonus,
        progresso,
        origemComissao,
        comissaoPercentualAplicada: comissaoPercentual,
      });
    });

    // Sort by total commission descending
    return items.sort((a, b) => b.comissaoTotal - a.comissaoTotal);
  }, [filteredClosers, filteredSdrs, metas, times, atendimentos, lancamentosSdr, lancamentosDisparo, lancamentosTrafego, monthStart, monthEnd]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      comissaoTotal: comissoes.reduce((sum, c) => sum + c.comissaoTotal, 0),
      bonusTotal: comissoes.reduce((sum, c) => sum + c.bonus, 0),
      pessoasComMeta: comissoes.filter(c => c.meta).length,
      pessoasBateram: comissoes.filter(c => c.progresso >= 100).length,
    };
  }, [comissoes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Single person view for vendedor/sdr
  const isSingleView = (isVendedor && profile?.closer_id) || (isSdr && profile?.sdr_id);

  // Export to Excel
  const handleExportComissoes = async () => {
    if (comissoes.length === 0) {
      toast.warning("Nenhuma comissão para exportar");
      return;
    }

    setIsExporting(true);
    try {
      // Main data sheet
      const worksheet = XLSX.utils.json_to_sheet(
        comissoes.map((item) => ({
          "Nome": item.nome,
          "Tipo": item.tipo === "closer" ? "Closer" : "SDR",
          "Time": item.timeNome || "-",
          "Vendas": item.vendas,
          "Receita (R$)": item.receita,
          "Meta Receita (R$)": item.meta?.meta_receita || 0,
          "Progresso (%)": Math.round(item.progresso),
          "% Comissão": item.comissaoPercentualAplicada,
          "Origem Comissão": item.origemComissao,
          "Comissão Base (R$)": item.comissaoBase,
          "Bônus (R$)": item.bonus,
          "Comissão Total (R$)": item.comissaoTotal,
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Comissões");

      // Summary sheet
      const resumo = XLSX.utils.json_to_sheet([
        { "Métrica": "Total Comissões", "Valor": formatCurrency(totals.comissaoTotal) },
        { "Métrica": "Total Bônus", "Valor": formatCurrency(totals.bonusTotal) },
        { "Métrica": "Pessoas com Meta", "Valor": totals.pessoasComMeta },
        { "Métrica": "Bateram Meta", "Valor": totals.pessoasBateram },
        { "Métrica": "Total Pessoas", "Valor": comissoes.length },
      ]);
      XLSX.utils.book_append_sheet(workbook, resumo, "Resumo");

      const monthLabel = format(parseISO(selectedMonth), "MMMM_yyyy", { locale: ptBR });
      const fileName = `Comissoes_${monthLabel}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Month filter - only show for admin/lider */}
      {!isSingleView && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
          <Button 
            onClick={handleExportComissoes} 
            disabled={isExporting || comissoes.length === 0}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar Excel"}
          </Button>
        </div>
      )}

      {/* Summary Cards - for admin/lider */}
      {!isSingleView && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Comissões Totais</p>
                  <p className="text-lg sm:text-xl font-bold text-primary truncate">
                    {formatCurrency(totals.comissaoTotal)}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Bônus Totais</p>
                  <p className="text-lg sm:text-xl font-bold text-green-500 truncate">
                    {formatCurrency(totals.bonusTotal)}
                  </p>
                </div>
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Com Meta</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {totals.pessoasComMeta}
                  </p>
                </div>
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Bateram Meta</p>
                  <p className="text-lg sm:text-xl font-bold text-green-500">
                    {totals.pessoasBateram}
                  </p>
                </div>
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commission Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            {isSingleView ? "Minha Comissão" : "Comissões por Pessoa"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comissoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma comissão encontrada para o período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isSingleView && <TableHead>Nome</TableHead>}
                    {!isSingleView && <TableHead>Tipo</TableHead>}
                    {!isSingleView && <TableHead>Time</TableHead>}
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Progresso</TableHead>
                    <TableHead className="text-right">% Comissão</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Bônus</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoes.map((item) => (
                    <TableRow key={`${item.tipo}-${item.id}`}>
                      {!isSingleView && (
                        <TableCell className="font-medium truncate max-w-[120px]">
                          {item.nome}
                        </TableCell>
                      )}
                      {!isSingleView && (
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {item.tipo === "closer" ? (
                              <Users className="h-3 w-3" />
                            ) : (
                              <Headphones className="h-3 w-3" />
                            )}
                            {item.tipo === "closer" ? "Closer" : "SDR"}
                          </Badge>
                        </TableCell>
                      )}
                      {!isSingleView && (
                        <TableCell className="text-muted-foreground">
                          {item.timeNome || "-"}
                        </TableCell>
                      )}
                      <TableCell className="text-right">{item.vendas}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.receita)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={
                          item.progresso >= 100 
                            ? "bg-green-500/20 text-green-500" 
                            : item.progresso >= 80 
                              ? "bg-yellow-500/20 text-yellow-500" 
                              : "bg-muted text-muted-foreground"
                        }>
                          {Math.round(item.progresso)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span>{item.comissaoPercentualAplicada}%</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1 ${
                              item.origemComissao === "Meta" 
                                ? "border-primary/50 text-primary" 
                                : "border-muted-foreground/50 text-muted-foreground"
                            }`}
                          >
                            {item.origemComissao}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.comissaoBase)}</TableCell>
                      <TableCell className="text-right">
                        {item.bonus > 0 ? (
                          <span className="text-green-500 font-medium">{formatCurrency(item.bonus)}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(item.comissaoTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
