import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminEmailRequest {
  to: string;
  toName: string | null;
  subject: string;
  message: string;
  senderName: string;
}

const generateEmailHTML = (message: string, recipientName: string | null, senderName: string) => {
  const displayName = recipientName || "Usuário";
  const year = new Date().getFullYear();
  
  // Convert line breaks to HTML
  const formattedMessage = message.replace(/\n/g, '<br>');
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mensagem - OptiClean Pro</title>
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
                    <table role="presentation" style="margin: 0 auto 16px auto;">
                      <tr>
                        <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 28px;">📬</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      OptiClean Pro
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                      Mensagem da Administração
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
                    <p style="margin: 0 0 24px 0; color: #8B949E; font-size: 14px;">
                      Você recebeu uma mensagem do administrador do OptiClean Pro.
                    </p>
                    
                    <!-- Message Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="background-color: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 12px; padding: 24px;">
                          <p style="margin: 0; color: #E6EDF3; font-size: 15px; line-height: 1.8;">
                            ${formattedMessage}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Sender Info -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;">
                      <tr>
                        <td style="text-align: right;">
                          <p style="margin: 0; color: #8B949E; font-size: 13px;">
                            Atenciosamente,
                          </p>
                          <p style="margin: 4px 0 0 0; color: #0EA5E9; font-size: 14px; font-weight: 600;">
                            ${senderName}
                          </p>
                          <p style="margin: 2px 0 0 0; color: #6E7681; font-size: 12px;">
                            Administração OptiClean Pro
                          </p>
                        </td>
                      </tr>
                    </table>
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
                      Dúvidas? Entre em contato conosco
                    </p>
                    <p style="margin: 0 0 20px 0;">
                      <a href="mailto:suporte@opticleanpro.com" style="color: #0EA5E9; text-decoration: none; font-size: 14px;">
                        📧 suporte@opticleanpro.com
                      </a>
                    </p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent, #30363D, transparent);"></td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0; color: #6E7681; font-size: 12px; line-height: 1.6;">
                      © ${year} OptiClean Pro. Todos os direitos reservados.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #6E7681; font-size: 11px;">
                      Sistema profissional de otimização e monitoramento para Windows
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
    const { to, toName, subject, message, senderName }: AdminEmailRequest = await req.json();

    console.log("Admin email request to:", to);

    if (!to || !subject || !message) {
      throw new Error("Campos obrigatórios: to, subject, message");
    }

    const emailHTML = generateEmailHTML(message, toName, senderName);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OptiClean Pro <onboarding@resend.dev>",
        to: [to],
        subject: `📬 ${subject}`,
        html: emailHTML,
      }),
    });

    const emailData = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Falha ao enviar email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-admin-email:", error);
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
