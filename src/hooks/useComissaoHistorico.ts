import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface ComissaoHistorico {
  id: string;
  entidade_tipo: "closer" | "sdr" | "lider";
  entidade_id: string;
  entidade_nome: string;
  campo_alterado: "comissao_percentual" | "bonus_extra";
  valor_anterior: number | null;
  valor_novo: number | null;
  alterado_por: string;
  alterado_por_nome: string;
  motivo: string | null;
  created_at: string;
}

export function useComissaoHistorico(entidadeTipo?: string, entidadeId?: string) {
  return useQuery({
    queryKey: ["comissao_historico", entidadeTipo, entidadeId],
    queryFn: async () => {
      let query = supabase
        .from("comissao_historico")
        .select("*")
        .order("created_at", { ascending: false });

      if (entidadeTipo) {
        query = query.eq("entidade_tipo", entidadeTipo);
      }
      if (entidadeId) {
        query = query.eq("entidade_id", entidadeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ComissaoHistorico[];
    },
    enabled: true,
  });
}

interface RegistrarAlteracaoParams {
  entidade_tipo: "closer" | "sdr" | "lider";
  entidade_id: string;
  entidade_nome: string;
  campo_alterado: "comissao_percentual" | "bonus_extra";
  valor_anterior: number | null;
  valor_novo: number | null;
  motivo?: string;
}

export function useRegistrarAlteracao() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (params: RegistrarAlteracaoParams) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("comissao_historico").insert({
        ...params,
        alterado_por: user.id,
        alterado_por_nome: profile?.nome || user.email || "Sistema",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comissao_historico"] });
    },
    onError: () => {
      toast.error("Erro ao registrar alteração no histórico");
    },
  });
}

// Helper function to compare and register changes
export async function registrarAlteracoesComissao(
  entidade_tipo: "closer" | "sdr" | "lider",
  entidade_id: string,
  entidade_nome: string,
  valorAntigoComissao: number | null | undefined,
  valorNovoComissao: number | null | undefined,
  valorAntigoBonus: number | null | undefined,
  valorNovoBonus: number | null | undefined,
  userId: string,
  userName: string
) {
  const alteracoes: Omit<RegistrarAlteracaoParams, 'motivo'>[] = [];

  // Check commission change
  const antigoComissao = valorAntigoComissao ?? 0;
  const novoComissao = valorNovoComissao ?? 0;
  if (antigoComissao !== novoComissao) {
    alteracoes.push({
      entidade_tipo,
      entidade_id,
      entidade_nome,
      campo_alterado: "comissao_percentual",
      valor_anterior: antigoComissao,
      valor_novo: novoComissao,
    });
  }

  // Check bonus change
  const antigoBonus = valorAntigoBonus ?? 0;
  const novoBonus = valorNovoBonus ?? 0;
  if (antigoBonus !== novoBonus) {
    alteracoes.push({
      entidade_tipo,
      entidade_id,
      entidade_nome,
      campo_alterado: "bonus_extra",
      valor_anterior: antigoBonus,
      valor_novo: novoBonus,
    });
  }

  // Insert all changes
  if (alteracoes.length > 0) {
    const { error } = await supabase.from("comissao_historico").insert(
      alteracoes.map((a) => ({
        ...a,
        alterado_por: userId,
        alterado_por_nome: userName,
      }))
    );
    if (error) throw error;
  }

  return alteracoes.length;
}
