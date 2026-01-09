import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface CloserGoogleToken {
  id: string;
  closer_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string | null;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
  message?: string;
  conflictingEvents?: Array<{
    summary: string;
    start: string;
    end: string;
  }>;
}

export interface CreateEventResult {
  success: boolean;
  eventId?: string;
  meetLink?: string;
  htmlLink?: string;
  reason?: string;
  message?: string;
}

export interface ConnectCloserParams {
  closerId: string;
  loginHint?: string;
}

export function useCloserGoogleTokens(closerId?: string) {
  return useQuery({
    queryKey: ["google_tokens_closers", closerId],
    queryFn: async () => {
      if (!closerId) return null;

      const { data, error } = await supabase
        .from("google_tokens_closers")
        .select("*")
        .eq("closer_id", closerId)
        .maybeSingle();

      if (error) throw error;
      return data as CloserGoogleToken | null;
    },
    enabled: !!closerId,
  });
}

export function useConnectCloserGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ closerId, loginHint }: ConnectCloserParams) => {
      // Pre-open popup synchronously during user gesture to avoid blockers
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      // Use window.top when in iframe, fallback to window
      const windowRef = window.top || window;
      const popup = windowRef.open(
        "about:blank",
        `google-auth-closer-${closerId}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup || popup.closed) {
        throw new Error("POPUP_BLOCKED");
      }

      // Now fetch the auth URL with optional loginHint
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: { action: "get_auth_url_closer", closerId, loginHint },
      });

      if (error) {
        popup.close();
        throw error;
      }

       console.log("Auth URL response:", data);

       return {
         authUrl: data.authUrl as string,
         redirectUri: (data.redirectUri as string | undefined) ?? undefined,
         closerId,
         popup,
       };
    },
     onSuccess: ({ authUrl, redirectUri, closerId, popup }) => {
       // Help operator configure Google OAuth client if needed
       if (redirectUri) {
         // Best-effort copy to clipboard (won't throw if blocked)
         try {
           navigator.clipboard?.writeText(redirectUri);
         } catch {
           // ignore
         }
         toast.info(`Redirect URI copiado: ${redirectUri}`);
       }

       // Navigate popup to auth URL
       if (popup && !popup.closed) {
         popup.location.href = authUrl;
       } else {
         // Fallback: open in new tab if popup was closed
         window.open(authUrl, "_blank");
         toast.info("Login do Google aberto em nova aba");
       }

      // Listener para mensagem de sucesso
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "GOOGLE_AUTH_CLOSER_SUCCESS" && event.data?.closerId === closerId) {
          queryClient.invalidateQueries({ queryKey: ["google_tokens_closers", closerId] });
          queryClient.invalidateQueries({ queryKey: ["closers"] });
          toast.success("Google Calendar conectado com sucesso!");
          window.removeEventListener("message", handleMessage);
        }
      };
      window.addEventListener("message", handleMessage);

      // Listener para quando o popup fechar
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          queryClient.invalidateQueries({ queryKey: ["google_tokens_closers", closerId] });
          queryClient.invalidateQueries({ queryKey: ["closers"] });
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);
    },
    onError: (error) => {
      console.error("Erro ao conectar Google Calendar do closer:", error);
      if (error instanceof Error && error.message === "POPUP_BLOCKED") {
        toast.error("Popup bloqueado! Permita popups ou tente em uma nova aba.");
      } else {
        toast.error("Erro ao conectar com Google Calendar");
      }
    },
  });
}

export function useDisconnectCloserGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (closerId: string) => {
      // Remover tokens
      const { error: tokenError } = await supabase
        .from("google_tokens_closers")
        .delete()
        .eq("closer_id", closerId);

      if (tokenError) throw tokenError;

      // Atualizar flag no closer
      const { error: closerError } = await supabase
        .from("closers")
        .update({ google_calendar_connected: false })
        .eq("id", closerId);

      if (closerError) throw closerError;
    },
    onSuccess: (_, closerId) => {
      queryClient.invalidateQueries({ queryKey: ["google_tokens_closers", closerId] });
      queryClient.invalidateQueries({ queryKey: ["closers"] });
      toast.success("Google Calendar desconectado");
    },
    onError: (error) => {
      console.error("Erro ao desconectar Google Calendar:", error);
      toast.error("Erro ao desconectar");
    },
  });
}

export function useCheckCloserAvailability() {
  return useMutation({
    mutationFn: async (params: {
      closerId: string;
      startDateTime: string;
      endDateTime: string;
    }): Promise<AvailabilityResult> => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "check_availability",
          ...params,
        },
      });

      if (error) throw error;
      return data as AvailabilityResult;
    },
  });
}

export function useCreateCloserCalendarEvent() {
  return useMutation({
    mutationFn: async (params: {
      closerId: string;
      title: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      attendees?: string[];
    }): Promise<CreateEventResult> => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "create_event_for_closer",
          ...params,
        },
      });

      if (error) throw error;
      return data as CreateEventResult;
    },
    onSuccess: (result) => {
      if (result.success && result.meetLink) {
        toast.success("Evento criado no Google Calendar!");
      }
    },
    onError: (error) => {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao criar evento no Google Calendar");
    },
  });
}

// Hook to fetch day events for a closer
export function useCloserDayEvents() {
  return useMutation({
    mutationFn: async (params: {
      closerId: string;
      date: string; // ISO date string
    }) => {
      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "get_day_events",
          ...params,
        },
      });

      if (error) throw error;
      return data as {
        events: Array<{
          id: string;
          summary: string;
          start: { dateTime?: string; date?: string };
          end: { dateTime?: string; date?: string };
        }>;
        hasCalendar: boolean;
      };
    },
  });
}

// Hook para verificar disponibilidade em tempo real
export function useAvailabilityCheck(
  closerId: string | undefined,
  date: Date | undefined,
  hora: string | undefined,
  enabled: boolean = true
) {
  const checkAvailability = useCheckCloserAvailability();

  useEffect(() => {
    if (!enabled || !closerId || !date || !hora) {
      return;
    }

    // Criar datetime de início
    const [hours, minutes] = hora.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Criar datetime de fim (1 hora depois)
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    checkAvailability.mutate({
      closerId,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
    });
  }, [closerId, date?.toISOString(), hora, enabled]);

  return {
    isChecking: checkAvailability.isPending,
    availability: checkAvailability.data,
    error: checkAvailability.error,
    checkNow: checkAvailability.mutate,
  };
}
