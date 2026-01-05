import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Segmento {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export function useSegmentos(includeInactive = false) {
  return useQuery({
    queryKey: ["segmentos", includeInactive],
    queryFn: async () => {
      let query = supabase.from("segmentos").select("*").order("nome");

      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Segmento[];
    },
  });
}

export function useCreateSegmento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("segmentos")
        .insert({ nome })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segmentos"] });
      toast.success("Segmento criado!");
    },
    onError: (error) => {
      console.error("Erro ao criar segmento:", error);
      toast.error("Erro ao criar segmento");
    },
  });
}

export function useUpdateSegmento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Segmento>;
    }) => {
      const { data: result, error } = await supabase
        .from("segmentos")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segmentos"] });
      toast.success("Segmento atualizado!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar segmento:", error);
      toast.error("Erro ao atualizar segmento");
    },
  });
}

export function useDeleteSegmento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("segmentos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segmentos"] });
      toast.success("Segmento removido!");
    },
    onError: (error) => {
      console.error("Erro ao remover segmento:", error);
      toast.error("Erro ao remover segmento");
    },
  });
}
