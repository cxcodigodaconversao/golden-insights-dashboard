import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificacaoConfig {
  id: string;
  tipo: "meta_atingida" | "queda_performance";
  ativo: boolean;
  emails_destino: string[];
  threshold_queda: number;
  created_at: string;
  updated_at: string;
}

export interface NotificacaoHistorico {
  id: string;
  tipo: string;
  destinatario: string;
  assunto: string;
  conteudo: string | null;
  enviado_em: string;
  status: string;
}

export function useNotificacoesConfig() {
  return useQuery({
    queryKey: ["notificacoes_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes_config")
        .select("*");
      
      if (error) {
        console.error("Error fetching notificacoes_config:", error);
        throw error;
      }
      
      return data as NotificacaoConfig[];
    },
  });
}

export function useNotificacoesHistorico(limit = 50) {
  return useQuery({
    queryKey: ["notificacoes_historico", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes_historico")
        .select("*")
        .order("enviado_em", { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error("Error fetching notificacoes_historico:", error);
        throw error;
      }
      
      return data as NotificacaoHistorico[];
    },
  });
}

export function useUpsertNotificacaoConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<NotificacaoConfig> & { tipo: string }) => {
      const { data, error } = await supabase
        .from("notificacoes_config")
        .upsert(config, { onConflict: "tipo" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes_config"] });
      toast.success("Configuração salva!");
    },
    onError: (error) => {
      console.error("Error saving notificacao config:", error);
      toast.error("Erro ao salvar configuração");
    },
  });
}
