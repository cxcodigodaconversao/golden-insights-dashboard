import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GoogleToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string | null;
}

export function useGoogleTokens() {
  return useQuery({
    queryKey: ["google_tokens"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return null;

      const { data, error } = await supabase
        .from("google_tokens")
        .select("*")
        .eq("user_id", session.session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data as GoogleToken | null;
    },
  });
}

export function useIsGoogleConnected() {
  const { data: tokens, isLoading } = useGoogleTokens();
  
  const isConnected = !!tokens && new Date(tokens.expires_at) > new Date();
  
  return { isConnected, isLoading };
}

export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: { action: "get_auth_url" },
      });

      if (error) throw error;
      return data.authUrl as string;
    },
    onSuccess: (authUrl) => {
      // Abrir popup para autenticação
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "google-auth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listener para quando o popup fechar
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          queryClient.invalidateQueries({ queryKey: ["google_tokens"] });
        }
      }, 1000);
    },
    onError: (error) => {
      console.error("Erro ao conectar Google Calendar:", error);
      toast.error("Erro ao conectar com Google Calendar");
    },
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("google_tokens")
        .delete()
        .eq("user_id", session.session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google_tokens"] });
      toast.success("Google Calendar desconectado");
    },
    onError: (error) => {
      console.error("Erro ao desconectar Google Calendar:", error);
      toast.error("Erro ao desconectar");
    },
  });
}

export function useCreateCalendarEvent() {
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      attendees?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "create_event",
          ...params,
        },
      });

      if (error) throw error;
      return data as { eventId: string; meetLink: string; htmlLink: string };
    },
    onError: (error) => {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao criar evento no Google Calendar");
    },
  });
}
