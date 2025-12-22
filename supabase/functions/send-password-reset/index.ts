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

const generateEmailHTML = (resetLink: string, userName: string | null) => {
  const displayName = userName || "Usuário";
  const year = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - OptiClean Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0D1117;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #0EA5E9 0%, #A855F7 100%); padding: 30px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <!-- Logo Icon -->
                    <table role="presentation" style="margin: 0 auto 16px auto;">
                      <tr>
                        <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 28px;">🛡️</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      OptiClean Pro
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      Sistema de Otimização Profissional
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #161B22; padding: 40px; border-left: 1px solid #30363D; border-right: 1px solid #30363D;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 8px 0; color: #E6EDF3; font-size: 22px; font-weight: 600;">
                      Olá, ${displayName}! 👋
                    </h2>
                    <p style="margin: 0 0 24px 0; color: #8B949E; font-size: 16px; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta OptiClean Pro.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 16px 0;">
                          <a href="${resetLink}" 
                             style="display: inline-block; background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
                            🔐 Redefinir Minha Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Expiration Notice -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                      <tr>
                        <td style="background-color: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 8px; padding: 16px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="width: 30px; vertical-align: top;">
                                <span style="font-size: 16px;">⏱️</span>
                              </td>
                              <td style="padding-left: 8px;">
                                <p style="margin: 0; color: #0EA5E9; font-size: 14px; font-weight: 600;">
                                  Link válido por 1 hora
                                </p>
                                <p style="margin: 4px 0 0 0; color: #8B949E; font-size: 13px;">
                                  Após esse período, será necessário solicitar um novo link.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Tips -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                      <tr>
                        <td style="background-color: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 16px;">
                          <p style="margin: 0 0 12px 0; color: #A855F7; font-size: 14px; font-weight: 600;">
                            🔒 Dicas de Segurança
                          </p>
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 4px 0; color: #8B949E; font-size: 13px;">• Nunca compartilhe este link com outras pessoas</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #8B949E; font-size: 13px;">• Crie uma senha forte com letras, números e símbolos</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #8B949E; font-size: 13px;">• Não use a mesma senha em outros serviços</td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; color: #8B949E; font-size: 13px;">• Se você não solicitou, ignore este email</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <p style="margin: 24px 0 0 0; color: #6E7681; font-size: 13px; line-height: 1.6;">
                      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                    </p>
                    <p style="margin: 8px 0 0 0; background: rgba(30, 41, 59, 0.5); border-radius: 8px; padding: 12px; word-break: break-all;">
                      <a href="${resetLink}" style="color: #0EA5E9; font-size: 12px; text-decoration: none;">
                        ${resetLink}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0D1117; border: 1px solid #30363D; border-top: none; border-radius: 0 0 16px 16px; padding: 30px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 16px 0; color: #8B949E; font-size: 14px;">
                      Precisa de ajuda? Entre em contato conosco
                    </p>
                    <p style="margin: 0 0 20px 0;">
                      <a href="mailto:suporte@opticleanpro.com" style="color: #0EA5E9; text-decoration: none; font-size: 14px;">
                        📧 suporte@opticleanpro.com
                      </a>
                    </p>
                    
                    <!-- Divider -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent, #30363D, transparent);"></td>
                      </tr>
                    </table>
                    
                    <!-- Company Info -->
                    <p style="margin: 0; color: #6E7681; font-size: 12px; line-height: 1.6;">
                      © ${year} OptiClean Pro. Todos os direitos reservados.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #6E7681; font-size: 11px;">
                      Sistema profissional de otimização e monitoramento para Windows
                    </p>
                    <p style="margin: 12px 0 0 0; color: #484F58; font-size: 10px;">
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
  `;
};

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

    // Fetch user's name from profiles
    let userName: string | null = null;
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email === email);
    
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      userName = profile?.full_name || null;
      console.log("Found user profile, name:", userName);
    }

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

    // Generate email HTML with user name
    const emailHTML = generateEmailHTML(resetLink, userName);

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
        html: emailHTML,
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
  } catch (error: unknown) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
