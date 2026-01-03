import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    // Obter token do header de autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Criar cliente Supabase
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar usuário autenticado
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    switch (action) {
      case "get_auth_url": {
        // Gerar URL de autenticação do Google
        if (!GOOGLE_CLIENT_ID) {
          throw new Error("Google Calendar não está configurado. Configure GOOGLE_CLIENT_ID nas secrets.");
        }

        const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar`;
        const scope = encodeURIComponent(
          "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar"
        );
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${scope}` +
          `&access_type=offline` +
          `&prompt=consent` +
          `&state=${user.id}`;

        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_event": {
        // Buscar tokens do usuário
        const { data: tokenData, error: tokenError } = await supabase
          .from("google_tokens")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (tokenError || !tokenData) {
          throw new Error("Google Calendar não conectado. Conecte sua conta primeiro.");
        }

        // Verificar se token expirou e renovar se necessário
        let accessToken = tokenData.access_token;
        if (new Date(tokenData.expires_at) < new Date()) {
          accessToken = await refreshAccessToken(tokenData.refresh_token, user.id, supabase);
        }

        // Criar evento no Google Calendar
        const { title, description, startDateTime, endDateTime, attendees } = params;

        const eventBody = {
          summary: title,
          description: description || "",
          start: {
            dateTime: startDateTime,
            timeZone: "America/Sao_Paulo",
          },
          end: {
            dateTime: endDateTime,
            timeZone: "America/Sao_Paulo",
          },
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
          attendees: attendees?.map((email: string) => ({ email })) || [],
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 },
              { method: "popup", minutes: 30 },
            ],
          },
        };

        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventBody),
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Google Calendar API error:", errorData);
          throw new Error("Erro ao criar evento no Google Calendar");
        }

        const event = await response.json();
        
        return new Response(
          JSON.stringify({
            eventId: event.id,
            meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
            htmlLink: event.htmlLink,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    console.error("Error in google-calendar function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handle OAuth callback (GET request with code parameter)
async function handleOAuthCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user_id

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  const supabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!
  );

  // Trocar código por tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${SUPABASE_URL}/functions/v1/google-calendar`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    console.error("Token exchange error:", errorData);
    return new Response("Failed to exchange code for tokens", { status: 400 });
  }

  const tokens = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Salvar tokens no banco
  const { error } = await supabase
    .from("google_tokens")
    .upsert({
      user_id: state,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_at: expiresAt,
      scope: tokens.scope,
    });

  if (error) {
    console.error("Error saving tokens:", error);
    return new Response("Failed to save tokens", { status: 500 });
  }

  // Retornar HTML que fecha a janela
  return new Response(
    `<html>
      <body>
        <script>
          window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS" }, "*");
          window.close();
        </script>
        <p>Autenticação concluída! Você pode fechar esta janela.</p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

async function refreshAccessToken(refreshToken: string, userId: string, supabase: any): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const tokens = await response.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Atualizar token no banco
  await supabase
    .from("google_tokens")
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt,
    })
    .eq("user_id", userId);

  return tokens.access_token;
}
