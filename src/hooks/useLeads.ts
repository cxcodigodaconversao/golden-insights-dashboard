import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem_primeira: string | null;
  sdr_primeiro: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoricoInteracao {
  id: string;
  lead_id: string;
  atendimento_id: string | null;
  tipo: string;
  descricao: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  data_interacao: string;
  usuario_nome: string | null;
  created_at: string;
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLeadById(leadId: string | null) {
  return useQuery({
    queryKey: ["leads", leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!leadId,
  });
}

export function useHistoricoByLeadId(leadId: string | null) {
  return useQuery({
    queryKey: ["historico_interacoes", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from("historico_interacoes")
        .select("*")
        .eq("lead_id", leadId)
        .order("data_interacao", { ascending: false });

      if (error) throw error;
      return data as HistoricoInteracao[];
    },
    enabled: !!leadId,
  });
}

export function useFindOrCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      nome: string;
      telefone?: string | null;
      email?: string | null;
      origem?: string | null;
      sdr?: string | null;
    }) => {
      // Tentar encontrar lead existente por telefone ou email
      let existingLead = null;

      if (params.telefone) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("telefone", params.telefone)
          .maybeSingle();
        existingLead = data;
      }

      if (!existingLead && params.email) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("email", params.email)
          .maybeSingle();
        existingLead = data;
      }

      if (existingLead) {
        return existingLead as Lead;
      }

      // Criar novo lead
      const { data, error } = await supabase
        .from("leads")
        .insert({
          nome: params.nome,
          telefone: params.telefone || null,
          email: params.email || null,
          origem_primeira: params.origem || null,
          sdr_primeiro: params.sdr || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useAddHistoricoInteracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      lead_id: string;
      atendimento_id?: string | null;
      tipo: string;
      descricao?: string | null;
      status_anterior?: string | null;
      status_novo?: string | null;
      usuario_nome?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("historico_interacoes")
        .insert({
          lead_id: params.lead_id,
          atendimento_id: params.atendimento_id || null,
          tipo: params.tipo,
          descricao: params.descricao || null,
          status_anterior: params.status_anterior || null,
          status_novo: params.status_novo || null,
          usuario_nome: params.usuario_nome || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HistoricoInteracao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["historico_interacoes", data.lead_id] });
    },
  });
}

export function useUpdateAtendimentoLeadId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { atendimentoId: string; leadId: string }) => {
      const { error } = await supabase
        .from("atendimentos")
        .update({ lead_id: params.leadId })
        .eq("id", params.atendimentoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
    },
  });
}

export function useAtendimentosByLeadId(leadId: string | null) {
  return useQuery({
    queryKey: ["atendimentos", "by_lead", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from("atendimentos")
        .select("*")
        .eq("lead_id", leadId)
        .order("data_call", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });
}
