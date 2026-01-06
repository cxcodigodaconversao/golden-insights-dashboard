import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientePipeline } from "./usePipeline";

// Hook para buscar dados da Pipeline para o Dashboard
export function usePipelineForDashboard() {
  return useQuery({
    queryKey: ["pipeline-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_pipeline")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export interface PipelineMetrics {
  totalLeads: number;
  vendas: number;
  receita: number;
  compareceram: number;
  naoCompareceram: number;
  taxaComparecimento: number;
  taxaConversao: number;
  ticketMedio: number;
}

export interface CloserStatsPipeline {
  nome: string;
  agendados: number;
  confirmados: number;
  compareceram: number;
  vendas: number;
  receita: number;
  percentualFechamento: number;
}

// Calcular métricas da Pipeline
export const calcularMetricasPipeline = (
  data: ClientePipeline[], 
  startDate: Date, 
  endDate: Date
): PipelineMetrics => {
  const filtered = data.filter((a) => {
    const createdAt = new Date(a.created_at || "");
    return createdAt >= startDate && createdAt <= endDate;
  });

  const vendas = filtered.filter((a) => a.etapa_atual === "ganho");
  const receita = vendas.reduce((acc, v) => acc + (v.valor_potencial || 0), 0);
  const compareceram = filtered.filter((a) => a.status !== "Não compareceu").length;
  const naoCompareceram = filtered.filter((a) => a.status === "Não compareceu").length;

  return {
    totalLeads: filtered.length,
    vendas: vendas.length,
    receita,
    compareceram,
    naoCompareceram,
    taxaComparecimento: filtered.length > 0 ? (compareceram / filtered.length) * 100 : 0,
    taxaConversao: compareceram > 0 ? (vendas.length / compareceram) * 100 : 0,
    ticketMedio: vendas.length > 0 ? receita / vendas.length : 0,
  };
};

// Calcular ranking de Closers da Pipeline
export const calcularRankingClosersPipeline = (
  data: ClientePipeline[],
  closersList: string[],
  startDate: Date,
  endDate: Date
): CloserStatsPipeline[] => {
  const filtered = data.filter((a) => {
    const createdAt = new Date(a.created_at || "");
    return createdAt >= startDate && createdAt <= endDate;
  });

  const closerMap: Record<string, CloserStatsPipeline> = {};

  closersList.forEach((closer) => {
    // Filtrar por closer_nome
    const closerData = filtered.filter((a) => a.closer_nome === closer);
    const vendas = closerData.filter((a) => a.etapa_atual === "ganho");
    const compareceram = closerData.filter((a) => a.status !== "Não compareceu").length;
    const receita = vendas.reduce((acc, v) => acc + (v.valor_potencial || 0), 0);

    closerMap[closer] = {
      nome: closer,
      agendados: closerData.length,
      confirmados: closerData.length,
      compareceram,
      vendas: vendas.length,
      receita,
      percentualFechamento: compareceram > 0 ? (vendas.length / compareceram) * 100 : 0,
    };
  });

  return Object.values(closerMap).sort((a, b) => b.receita - a.receita);
};

// Calcular ranking de SDRs da Pipeline
export const calcularRankingSdrsPipeline = (
  data: ClientePipeline[],
  sdrsList: string[],
  startDate: Date,
  endDate: Date
) => {
  const filtered = data.filter((a) => {
    const createdAt = new Date(a.created_at || "");
    return createdAt >= startDate && createdAt <= endDate;
  });

  const sdrMap: Record<string, {
    nome: string;
    agendamentos: number;
    compareceram: number;
    vendas: number;
    receita: number;
    taxaComparecimento: number;
  }> = {};

  sdrsList.forEach((sdr) => {
    // Filtrar por str_responsavel_nome ou sdr_nome
    const sdrData = filtered.filter((a) => 
      a.str_responsavel_nome === sdr || a.sdr_nome === sdr
    );
    const compareceram = sdrData.filter((a) => a.status !== "Não compareceu").length;
    const vendas = sdrData.filter((a) => a.etapa_atual === "ganho");
    const receita = vendas.reduce((acc, v) => acc + (v.valor_potencial || 0), 0);

    sdrMap[sdr] = {
      nome: sdr,
      agendamentos: sdrData.length,
      compareceram,
      vendas: vendas.length,
      receita,
      taxaComparecimento: sdrData.length > 0 ? (compareceram / sdrData.length) * 100 : 0,
    };
  });

  return Object.values(sdrMap).sort((a, b) => b.agendamentos - a.agendamentos);
};
