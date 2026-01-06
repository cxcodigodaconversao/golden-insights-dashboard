import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ClientePipeline {
  id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  empresa: string | null;
  segmento: string | null;
  origem_lead: string | null;
  observacoes: string | null;
  etapa_atual: string;
  temperatura: string | null;
  valor_potencial: number | null;
  proximo_passo: string | null;
  data_proximo_contato: string | null;
  str_responsavel_id: string;
  str_responsavel_nome: string;
  closer_responsavel_id: string | null;
  closer_responsavel_nome: string | null;
  etapa_atualizada_em: string | null;
  created_at: string;
  updated_at: string;
  // Novos campos unificados com Atendimentos
  cliente_id: string | null;
  data_call: string | null;
  hora_call: string | null;
  sdr_id: string | null;
  sdr_nome: string | null;
  closer_id: string | null;
  closer_nome: string | null;
  origem_id: string | null;
  origem_nome: string | null;
  status: string | null;
  info_sdr: string | null;
  gravacao: string | null;
}

export interface HistoricoPipeline {
  id: string;
  cliente_id: string;
  etapa_anterior: string | null;
  etapa_nova: string | null;
  usuario_id: string;
  usuario_nome: string;
  tipo: string;
  nota: string | null;
  created_at: string;
}

export interface CreateClientePipelineData {
  nome: string;
  whatsapp: string;
  email?: string;
  empresa?: string;
  segmento?: string;
  origem_lead?: string;
  observacoes?: string;
  etapa_atual?: string;
  temperatura?: string;
  valor_potencial?: number;
  proximo_passo?: string;
  data_proximo_contato?: string;
  // Novos campos unificados com Atendimentos
  cliente_id?: string;
  data_call?: string;
  hora_call?: string;
  sdr_id?: string;
  sdr_nome?: string;
  closer_id?: string;
  closer_nome?: string;
  origem_id?: string;
  origem_nome?: string;
  status?: string;
  info_sdr?: string;
  gravacao?: string;
}

export const ETAPAS_PIPELINE = [
  { id: "primeiro_contato", nome: "Primeiro Contato", cor: "#6B7280" },
  { id: "em_qualificacao", nome: "Em Qualificação", cor: "#3B82F6" },
  { id: "desqualificado", nome: "Desqualificado", cor: "#991B1B" },
  { id: "proposta_enviada", nome: "Proposta Enviada", cor: "#F59E0B" },
  { id: "em_negociacao", nome: "Em Negociação", cor: "#F97316" },
  { id: "fechamento_pendente", nome: "Fechamento Pendente", cor: "#8B5CF6" },
  { id: "ganho", nome: "Ganho", cor: "#22C55E" },
  { id: "perdido", nome: "Perdido", cor: "#EF4444" },
] as const;

export const STATUS_ATENDIMENTO = [
  "Em negociação",
  "Venda Confirmada",
  "Venda Reembolsada",
  "Não fechou",
  "Não compareceu",
  "Remarcado",
] as const;

export const ORIGENS_LEAD = [
  "Instagram",
  "Facebook",
  "Google",
  "Indicação",
  "Evento",
  "WhatsApp",
  "LinkedIn",
  "Outro",
] as const;

export const TEMPERATURAS = [
  { id: "frio", nome: "Frio", emoji: "🔵" },
  { id: "morno", nome: "Morno", emoji: "🟡" },
  { id: "quente", nome: "Quente", emoji: "🔴" },
] as const;

// Hook para buscar todos os clientes do pipeline
export function useClientesPipeline() {
  return useQuery({
    queryKey: ["clientes-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_pipeline")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClientePipeline[];
    },
  });
}

// Hook para buscar clientes por etapa
export function useClientesPipelineByEtapa(etapa: string) {
  return useQuery({
    queryKey: ["clientes-pipeline", "etapa", etapa],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_pipeline")
        .select("*")
        .eq("etapa_atual", etapa)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClientePipeline[];
    },
  });
}

// Hook para criar cliente no pipeline
export function useCreateClientePipeline() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateClientePipelineData) => {
      if (!user || !profile) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("clientes_pipeline")
        .insert({
          ...data,
          str_responsavel_id: user.id,
          str_responsavel_nome: profile.nome,
          etapa_atual: data.etapa_atual || "primeiro_contato",
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("historico_pipeline").insert({
        cliente_id: result.id,
        etapa_anterior: null,
        etapa_nova: result.etapa_atual,
        usuario_id: user.id,
        usuario_nome: profile.nome,
        tipo: "criacao",
        nota: "Cliente cadastrado no pipeline",
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-pipeline"] });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao cadastrar cliente");
    },
  });
}

// Hook para atualizar cliente
export function useUpdateClientePipeline() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ClientePipeline>;
    }) => {
      if (!user || !profile) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("clientes_pipeline")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar edição no histórico
      await supabase.from("historico_pipeline").insert({
        cliente_id: id,
        usuario_id: user.id,
        usuario_nome: profile.nome,
        tipo: "edicao",
        nota: "Dados do cliente atualizados",
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-pipeline"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    },
  });
}

// Hook para mover cliente entre etapas
export function useMoveClienteEtapa() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      etapaAnterior,
      etapaNova,
    }: {
      id: string;
      etapaAnterior: string;
      etapaNova: string;
    }) => {
      if (!user || !profile) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("clientes_pipeline")
        .update({
          etapa_atual: etapaNova,
          etapa_atualizada_em: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar mudança no histórico
      await supabase.from("historico_pipeline").insert({
        cliente_id: id,
        etapa_anterior: etapaAnterior,
        etapa_nova: etapaNova,
        usuario_id: user.id,
        usuario_nome: profile.nome,
        tipo: "mudanca_etapa",
      });

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientes-pipeline"] });
      const etapaNome = ETAPAS_PIPELINE.find(
        (e) => e.id === variables.etapaNova
      )?.nome;
      toast.success(`Cliente movido para ${etapaNome}`);
    },
    onError: (error) => {
      console.error("Erro ao mover cliente:", error);
      toast.error("Erro ao mover cliente");
    },
  });
}

// Hook para buscar histórico de um cliente
export function useHistoricoPipeline(clienteId: string) {
  return useQuery({
    queryKey: ["historico-pipeline", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_pipeline")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HistoricoPipeline[];
    },
    enabled: !!clienteId,
  });
}

// Hook para adicionar nota ao histórico
export function useAddNotaPipeline() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      clienteId,
      nota,
    }: {
      clienteId: string;
      nota: string;
    }) => {
      if (!user || !profile) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("historico_pipeline")
        .insert({
          cliente_id: clienteId,
          usuario_id: user.id,
          usuario_nome: profile.nome,
          tipo: "nota",
          nota,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["historico-pipeline", variables.clienteId],
      });
      toast.success("Nota adicionada!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar nota:", error);
      toast.error("Erro ao adicionar nota");
    },
  });
}

// Hook para estatísticas do pipeline
export function usePipelineStats() {
  const { data: clientes = [] } = useClientesPipeline();

  const stats = ETAPAS_PIPELINE.map((etapa) => {
    const clientesEtapa = clientes.filter((c) => c.etapa_atual === etapa.id);
    return {
      etapa: etapa.id,
      nome: etapa.nome,
      cor: etapa.cor,
      quantidade: clientesEtapa.length,
      valorTotal: clientesEtapa.reduce(
        (sum, c) => sum + (c.valor_potencial || 0),
        0
      ),
    };
  });

  const totalLeads = clientes.length;
  const totalValor = clientes.reduce(
    (sum, c) => sum + (c.valor_potencial || 0),
    0
  );
  const ganhos = clientes.filter((c) => c.etapa_atual === "ganho").length;
  const taxaConversao = totalLeads > 0 ? (ganhos / totalLeads) * 100 : 0;

  return {
    stats,
    totalLeads,
    totalValor,
    ganhos,
    taxaConversao,
  };
}
