import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Meta {
  id: string;
  tipo: "closer" | "sdr";
  referencia_id: string;
  mes: string;
  meta_vendas: number;
  meta_receita: number;
  meta_agendamentos: number;
  comissao_percentual: number;
  bonus_extra: number;
  campanha_nome: string | null;
  campanha_ativa: boolean;
  created_at: string;
  updated_at: string;
}

export function useMetas(mes?: string) {
  return useQuery({
    queryKey: ["metas", mes],
    queryFn: async () => {
      let query = supabase.from("metas").select("*");
      
      if (mes) {
        query = query.eq("mes", mes);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching metas:", error);
        throw error;
      }
      
      return data as Meta[];
    },
  });
}

export function useMetaByReference(tipo: "closer" | "sdr", referenciaId: string, mes: string) {
  return useQuery({
    queryKey: ["meta", tipo, referenciaId, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("tipo", tipo)
        .eq("referencia_id", referenciaId)
        .eq("mes", mes)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching meta:", error);
        throw error;
      }
      
      return data as Meta | null;
    },
    enabled: !!referenciaId && !!mes,
  });
}

export function useCreateMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meta: Omit<Meta, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("metas")
        .upsert(meta, { onConflict: "tipo,referencia_id,mes" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      toast.success("Meta salva com sucesso!");
    },
    onError: (error) => {
      console.error("Error saving meta:", error);
      toast.error("Erro ao salvar meta");
    },
  });
}

export function useDeleteMeta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("metas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas"] });
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      toast.success("Meta excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting meta:", error);
      toast.error("Erro ao excluir meta");
    },
  });
}
