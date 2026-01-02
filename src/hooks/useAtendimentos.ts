import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Atendimento = Tables<"atendimentos"> & {
  dataCall: Date;
};

export interface CloserStats {
  nome: string;
  agendados: number;
  confirmados: number;
  compareceram: number;
  vendas: number;
  receita: number;
  percentualFechamento: number;
}

export const statusColors: Record<string, { bg: string; text: string }> = {
  "Venda Recorrente": { bg: "bg-success/20", text: "text-success" },
  "Venda": { bg: "bg-success/20", text: "text-success" },
  "Pagamento agendado": { bg: "bg-warning/20", text: "text-warning" },
  "Em negociação": { bg: "bg-primary/20", text: "text-primary" },
  "Não compareceu": { bg: "bg-destructive/20", text: "text-destructive" },
  "Reembolsada": { bg: "bg-destructive/20", text: "text-destructive" },
  "Cancelado": { bg: "bg-destructive/20", text: "text-destructive" },
  "Sem interesse": { bg: "bg-muted", text: "text-muted-foreground" },
  "Sem dinheiro": { bg: "bg-muted", text: "text-muted-foreground" },
  "Não é prioridade": { bg: "bg-muted", text: "text-muted-foreground" },
  "Quer apenas no futuro": { bg: "bg-secondary", text: "text-secondary-foreground" },
  "Call Remarcada": { bg: "bg-secondary", text: "text-secondary-foreground" },
  "Sem qualificação": { bg: "bg-muted", text: "text-muted-foreground" },
};

export function useAtendimentos() {
  return useQuery({
    queryKey: ["atendimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select("*")
        .order("data_call", { ascending: false });

      if (error) throw error;

      // Transform data_call string to Date
      return (data || []).map((item) => ({
        ...item,
        dataCall: new Date(item.data_call),
      }));
    },
  });
}

export function useClosers(includeInactive = false) {
  return useQuery({
    queryKey: ["closers", includeInactive],
    queryFn: async () => {
      let query = supabase.from("closers").select("*").order("nome");
      
      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSdrs(includeInactive = false) {
  return useQuery({
    queryKey: ["sdrs", includeInactive],
    queryFn: async () => {
      let query = supabase.from("sdrs").select("*").order("nome");
      
      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useOrigens(includeInactive = false) {
  return useQuery({
    queryKey: ["origens", includeInactive],
    queryFn: async () => {
      let query = supabase.from("origens").select("*").order("nome");
      
      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// Métricas calculadas
export const calcularMetricas = (data: Atendimento[], startDate: Date, endDate: Date) => {
  const filtered = data.filter((a) => a.dataCall >= startDate && a.dataCall <= endDate);

  const vendas = filtered.filter(
    (a) => a.status.includes("Venda") && !a.status.includes("Reembolsada")
  );
  const receita = vendas.reduce((acc, v) => acc + (v.valor || 0), 0);
  const compareceram = filtered.filter((a) => !a.status.includes("Não compareceu")).length;
  const naoCompareceram = filtered.filter((a) => a.status.includes("Não compareceu")).length;

  return {
    totalAtendimentos: filtered.length,
    vendas: vendas.length,
    receita,
    compareceram,
    naoCompareceram,
    taxaComparecimento: filtered.length > 0 ? (compareceram / filtered.length) * 100 : 0,
    taxaConversao: compareceram > 0 ? (vendas.length / compareceram) * 100 : 0,
    ticketMedio: vendas.length > 0 ? receita / vendas.length : 0,
  };
};

export const calcularRankingClosers = (
  data: Atendimento[],
  closersList: string[],
  startDate: Date,
  endDate: Date
): CloserStats[] => {
  const filtered = data.filter((a) => a.dataCall >= startDate && a.dataCall <= endDate);
  const closerMap: Record<string, CloserStats> = {};

  closersList.forEach((closer) => {
    const closerData = filtered.filter((a) => a.closer === closer);
    const vendas = closerData.filter(
      (a) => a.status.includes("Venda") && !a.status.includes("Reembolsada")
    );
    const compareceram = closerData.filter((a) => !a.status.includes("Não compareceu")).length;
    const receita = vendas.reduce((acc, v) => acc + (v.valor || 0), 0);

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
