import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Types
export type LancamentoSDR = Tables<"lancamentos_sdr">;
export type LancamentoDisparo = Tables<"lancamentos_disparo">;
export type LancamentoTrafego = Tables<"lancamentos_trafego">;
export type VendaRegistro = Tables<"vendas_registro">;

// Lancamentos SDR Hook
export function useLancamentosSDR(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["lancamentos_sdr", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("lancamentos_sdr")
        .select("*")
        .order("data", { ascending: false });

      if (startDate && endDate) {
        query = query
          .gte("data", startDate.toISOString().split("T")[0])
          .lte("data", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateLancamentoSDR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lancamento: Omit<LancamentoSDR, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("lancamentos_sdr")
        .insert(lancamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_sdr"] });
    },
  });
}

export function useUpdateLancamentoSDR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LancamentoSDR> & { id: string }) => {
      const { data, error } = await supabase
        .from("lancamentos_sdr")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_sdr"] });
    },
  });
}

export function useDeleteLancamentoSDR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos_sdr").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_sdr"] });
    },
  });
}

// Lancamentos Disparo Hook
export function useLancamentosDisparo(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["lancamentos_disparo", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("lancamentos_disparo")
        .select("*")
        .order("data", { ascending: false });

      if (startDate && endDate) {
        query = query
          .gte("data", startDate.toISOString().split("T")[0])
          .lte("data", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateLancamentoDisparo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lancamento: Omit<LancamentoDisparo, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("lancamentos_disparo")
        .insert(lancamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_disparo"] });
    },
  });
}

export function useUpdateLancamentoDisparo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LancamentoDisparo> & { id: string }) => {
      const { data, error } = await supabase
        .from("lancamentos_disparo")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_disparo"] });
    },
  });
}

export function useDeleteLancamentoDisparo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos_disparo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_disparo"] });
    },
  });
}

// Lancamentos Trafego Hook
export function useLancamentosTrafego(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["lancamentos_trafego", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("lancamentos_trafego")
        .select("*")
        .order("data", { ascending: false });

      if (startDate && endDate) {
        query = query
          .gte("data", startDate.toISOString().split("T")[0])
          .lte("data", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateLancamentoTrafego() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lancamento: Omit<LancamentoTrafego, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("lancamentos_trafego")
        .insert(lancamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_trafego"] });
    },
  });
}

export function useUpdateLancamentoTrafego() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LancamentoTrafego> & { id: string }) => {
      const { data, error } = await supabase
        .from("lancamentos_trafego")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_trafego"] });
    },
  });
}

export function useDeleteLancamentoTrafego() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos_trafego").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos_trafego"] });
    },
  });
}

// Vendas Registro Hook
export function useVendasRegistro(tipo?: "disparo" | "trafego", startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["vendas_registro", tipo, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("vendas_registro")
        .select("*")
        .order("data", { ascending: false });

      if (tipo) {
        query = query.eq("tipo", tipo);
      }

      if (startDate && endDate) {
        query = query
          .gte("data", startDate.toISOString().split("T")[0])
          .lte("data", endDate.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateVendaRegistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venda: Omit<VendaRegistro, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("vendas_registro")
        .insert(venda)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas_registro"] });
    },
  });
}

export function useUpdateVendaRegistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendaRegistro> & { id: string }) => {
      const { data, error } = await supabase
        .from("vendas_registro")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas_registro"] });
    },
  });
}

export function useDeleteVendaRegistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendas_registro").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas_registro"] });
    },
  });
}

// Metrics calculations
export const calcularMetricasLancamento = (lancamentos: (LancamentoDisparo | LancamentoTrafego)[]) => {
  const totals = lancamentos.reduce(
    (acc, l) => ({
      abordados: acc.abordados + l.abordados,
      agendados: acc.agendados + l.agendados,
      confirmados: acc.confirmados + l.confirmados,
      compareceram: acc.compareceram + l.compareceram,
      vendas: acc.vendas + l.vendas,
      receita: acc.receita + Number(l.receita),
    }),
    { abordados: 0, agendados: 0, confirmados: 0, compareceram: 0, vendas: 0, receita: 0 }
  );

  return {
    ...totals,
    percentComparecimento: totals.agendados > 0 ? (totals.compareceram / totals.agendados) * 100 : 0,
    percentCompConfirmados: totals.confirmados > 0 ? (totals.compareceram / totals.confirmados) * 100 : 0,
    percentVendasAgendados: totals.agendados > 0 ? (totals.vendas / totals.agendados) * 100 : 0,
    percentVendasCompareceram: totals.compareceram > 0 ? (totals.vendas / totals.compareceram) * 100 : 0,
  };
};

export const calcularMetricasSDR = (lancamentos: LancamentoSDR[]) => {
  const totals = lancamentos.reduce(
    (acc, l) => ({
      abordados: acc.abordados + l.abordados,
      responderam: acc.responderam + l.responderam,
      agendamentos: acc.agendamentos + l.agendamentos,
      vendas: acc.vendas + l.vendas_agendamentos,
    }),
    { abordados: 0, responderam: 0, agendamentos: 0, vendas: 0 }
  );

  return {
    ...totals,
    percentResponderam: totals.abordados > 0 ? (totals.responderam / totals.abordados) * 100 : 0,
    percentAgendamentos: totals.responderam > 0 ? (totals.agendamentos / totals.responderam) * 100 : 0,
  };
};
