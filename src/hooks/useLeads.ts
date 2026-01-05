import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem_primeira: string | null;
  sdr_primeiro: string | null;
  cliente_id: string | null;
  owner_id: string | null;
  owner_type: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
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

// Buscar apenas leads ativos (não deletados)
export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });
}

// Buscar leads na lixeira (deletados)
export function useDeletedLeads() {
  return useQuery({
    queryKey: ["leads", "deleted"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });
}

// Contagem de leads na lixeira
export function useDeletedLeadsCount() {
  return useQuery({
    queryKey: ["leads", "deleted", "count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .not("deleted_at", "is", null);

      if (error) throw error;
      return count || 0;
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
      // Tentar encontrar lead existente por telefone ou email (apenas ativos)
      let existingLead = null;

      if (params.telefone) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("telefone", params.telefone)
          .is("deleted_at", null)
          .maybeSingle();
        existingLead = data;
      }

      if (!existingLead && params.email) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .eq("email", params.email)
          .is("deleted_at", null)
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

// Soft delete - move lead para lixeira
export function useSoftDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { leadId: string; deletedBy: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: params.deletedBy,
        })
        .eq("id", params.leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted", "count"] });
    },
  });
}

// Restaurar lead da lixeira
export function useRestoreLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from("leads")
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted", "count"] });
    },
  });
}

// Hard delete - exclusão permanente (apenas admin)
export function useHardDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      // Primeiro deletar registros relacionados
      await supabase
        .from("historico_interacoes")
        .delete()
        .eq("lead_id", leadId);

      await supabase
        .from("lead_ownership_history")
        .delete()
        .eq("lead_id", leadId);

      // Remover referência em atendimentos
      await supabase
        .from("atendimentos")
        .update({ lead_id: null })
        .eq("lead_id", leadId);

      // Finalmente deletar o lead
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted", "count"] });
    },
  });
}

// Esvaziar lixeira (exclusão permanente em massa)
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Buscar todos os leads deletados
      const { data: deletedLeads } = await supabase
        .from("leads")
        .select("id")
        .not("deleted_at", "is", null);

      if (!deletedLeads || deletedLeads.length === 0) return;

      const leadIds = deletedLeads.map(l => l.id);

      // Deletar registros relacionados
      await supabase
        .from("historico_interacoes")
        .delete()
        .in("lead_id", leadIds);

      await supabase
        .from("lead_ownership_history")
        .delete()
        .in("lead_id", leadIds);

      // Remover referências em atendimentos
      await supabase
        .from("atendimentos")
        .update({ lead_id: null })
        .in("lead_id", leadIds);

      // Deletar leads
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", leadIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "deleted", "count"] });
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
