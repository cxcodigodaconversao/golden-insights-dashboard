import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StatusAtendimento {
  id: string;
  nome: string;
  ativo: boolean;
  sincroniza_etapa: string | null;
  ordem: number;
  created_at: string;
}

export function useStatusAtendimento(includeInactive = false) {
  return useQuery({
    queryKey: ["status_atendimento", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("status_atendimento")
        .select("*")
        .order("ordem");

      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StatusAtendimento[];
    },
  });
}

export function useCreateStatusAtendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nome,
      sincroniza_etapa,
      ordem,
    }: {
      nome: string;
      sincroniza_etapa?: string | null;
      ordem?: number;
    }) => {
      const { data, error } = await supabase
        .from("status_atendimento")
        .insert({ nome, sincroniza_etapa, ordem: ordem || 0 })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status_atendimento"] });
      toast.success("Status criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar status:", error);
      toast.error("Erro ao criar status");
    },
  });
}

export function useUpdateStatusAtendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StatusAtendimento>;
    }) => {
      const { data: result, error } = await supabase
        .from("status_atendimento")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status_atendimento"] });
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    },
  });
}

export function useDeleteStatusAtendimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - apenas desativa
      const { error } = await supabase
        .from("status_atendimento")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status_atendimento"] });
      toast.success("Status removido!");
    },
    onError: (error) => {
      console.error("Erro ao remover status:", error);
      toast.error("Erro ao remover status");
    },
  });
}
