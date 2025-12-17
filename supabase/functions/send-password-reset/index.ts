import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: PasswordResetRequest = await req.json();

    console.log("Password reset request for:", email);

    // Create admin client with service role
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      throw new Error(linkError.message);
    }

    const resetLink = linkData.properties.action_link;
    console.log("Generated reset link successfully");

    // Send custom email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OptiClean Pro <onboarding@resend.dev>",
        to: [email],
        subject: "🔐 Redefinição de Senha - OptiClean Pro",
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de Senha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0D1117;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(14, 165, 233, 0.2);">
              <div style="display: inline-block; background: linear-gradient(135deg, #0EA5E9 0%, #A855F7 100%); padding: 16px 24px; border-radius: 12px; margin-bottom: 16px;">
                <span style="font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 1px;">⚡ OptiClean Pro</span>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Sistema Profissional de Otimização</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #f1f5f9; font-size: 24px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                Redefinição de Senha
              </h1>
              
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                Recebemos uma solicitação para redefinir a senha da sua conta associada a este email.
              </p>
              
              <!-- Security Icon -->
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background: rgba(14, 165, 233, 0.1); border: 2px solid rgba(14, 165, 233, 0.3); border-radius: 50%; padding: 24px;">
                  <span style="font-size: 48px;">🔒</span>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #0EA5E9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.4);">
                  🔑 Redefinir Minha Senha
                </a>
              </div>
              
              <!-- Alternative Link -->
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 24px 0 0; text-align: center;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="background: rgba(30, 41, 59, 0.5); border-radius: 8px; padding: 12px; margin: 8px 0 24px; word-break: break-all;">
                <a href="${resetLink}" style="color: #0EA5E9; font-size: 12px; text-decoration: none;">${resetLink}</a>
              </p>
              
              <!-- Warning Box -->
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 16px; margin-top: 24px;">
                <p style="color: #fbbf24; font-size: 14px; margin: 0;">
                  <span style="margin-right: 8px;">⚠️</span>
                  <strong>Atenção:</strong>
                </p>
                <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0;">
                  Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança. Sua senha atual permanecerá inalterada.
                </p>
              </div>
              
              <!-- Expiry Notice -->
              <p style="color: #64748b; font-size: 12px; text-align: center; margin: 24px 0 0;">
                Este link expira em <strong style="color: #0EA5E9;">1 hora</strong> por motivos de segurança.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(14, 165, 233, 0.2);">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">
                      © ${new Date().getFullYear()} OptiClean Pro. Todos os direitos reservados.
                    </p>
                    <p style="color: #475569; font-size: 11px; margin: 0;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
