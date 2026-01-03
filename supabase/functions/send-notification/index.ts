import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  tipo: "meta_atingida" | "queda_performance";
  destinatarios: string[];
  dados: {
    nome: string;
    tipo_pessoa: "closer" | "sdr";
    meta_valor?: number;
    atual_valor?: number;
    percentual?: number;
    periodo?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email send");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured. Please set RESEND_API_KEY." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tipo, destinatarios, dados }: NotificationRequest = await req.json();
    console.log("Notification request:", { tipo, destinatarios, dados });

    if (!destinatarios || destinatarios.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No recipients provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject = "";
    let htmlContent = "";

    if (tipo === "meta_atingida") {
      subject = `🎉 Parabéns! ${dados.nome} atingiu a meta!`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d2bc8f, #c4a574); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #1a1814; margin: 0;">🏆 Meta Atingida!</h1>
          </div>
          <div style="background: #f8f6f3; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333;">
              <strong>${dados.nome}</strong> (${dados.tipo_pessoa === "closer" ? "Closer" : "SDR"}) 
              atingiu <strong>${dados.percentual}%</strong> da meta!
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Resultado:</strong> ${dados.atual_valor}</p>
              <p style="margin: 5px 0;"><strong>Meta:</strong> ${dados.meta_valor}</p>
              <p style="margin: 5px 0;"><strong>Período:</strong> ${dados.periodo || "Mês atual"}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Continue acompanhando os resultados no dashboard.
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `⚠️ Alerta: Queda de performance detectada - ${dados.nome}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ef4444; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">⚠️ Alerta de Performance</h1>
          </div>
          <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; color: #333;">
              Foi detectada uma queda de <strong>${dados.percentual}%</strong> nos resultados de 
              <strong>${dados.nome}</strong> (${dados.tipo_pessoa === "closer" ? "Closer" : "SDR"}).
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 5px 0;"><strong>Resultado atual:</strong> ${dados.atual_valor}</p>
              <p style="margin: 5px 0;"><strong>Resultado anterior:</strong> ${dados.meta_valor}</p>
              <p style="margin: 5px 0;"><strong>Variação:</strong> -${dados.percentual}%</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Recomendamos verificar a situação e tomar as medidas necessárias.
            </p>
          </div>
        </div>
      `;
    }

    // Send email using Resend
    const emailResults = [];
    for (const email of destinatarios) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "CX Comercial <onboarding@resend.dev>",
            to: [email],
            subject,
            html: htmlContent,
          }),
        });

        const result = await res.json();
        console.log(`Email sent to ${email}:`, result);

        // Log to database
        await supabase.from("notificacoes_historico").insert({
          tipo,
          destinatario: email,
          assunto: subject,
          conteudo: htmlContent,
          status: res.ok ? "enviado" : "erro",
        });

        emailResults.push({ email, success: res.ok, result });
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        
        await supabase.from("notificacoes_historico").insert({
          tipo,
          destinatario: email,
          assunto: subject,
          conteudo: htmlContent,
          status: "erro",
        });

        emailResults.push({ email, success: false, error: (emailError as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results: emailResults }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
