// ============================================
// Discord Webhook Service
// Enviar alertas e notificações via Discord
// ============================================

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

// Cores para diferentes tipos de alerta
const COLORS = {
  success: 0x22c55e, // verde
  warning: 0xeab308, // amarelo
  error: 0xef4444,   // vermelho
  info: 0x3b82f6,    // azul
  primary: 0x8b5cf6, // roxo
};

// Obter webhook URL do localStorage ou configuração
const getWebhookUrl = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('discord_webhook_url');
  }
  return null;
};

// Salvar webhook URL
export const setWebhookUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('discord_webhook_url', url);
  }
};

// Obter webhook URL
export const getStoredWebhookUrl = (): string | null => {
  return getWebhookUrl();
};

// Verificar se notificações Discord estão habilitadas
export const isDiscordEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('discord_notifications_enabled') === 'true';
  }
  return false;
};

// Habilitar/desabilitar notificações Discord
export const setDiscordEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('discord_notifications_enabled', String(enabled));
  }
};

// Enviar mensagem para Discord
export const sendDiscordMessage = async (message: DiscordMessage): Promise<boolean> => {
  const webhookUrl = getWebhookUrl();
  
  if (!webhookUrl || !isDiscordEnabled()) {
    console.log('[Discord] Notificações desabilitadas ou webhook não configurado');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: message.username || 'OptiClean Pro',
        avatar_url: message.avatar_url || 'https://i.imgur.com/AfFp7pu.png',
        ...message,
      }),
    });

    if (!response.ok) {
      console.error('[Discord] Erro ao enviar:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Discord] Erro ao enviar mensagem:', error);
    return false;
  }
};

// Enviar alerta de sistema
export const sendSystemAlert = async (
  title: string,
  description: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  fields?: Array<{ name: string; value: string; inline?: boolean }>
): Promise<boolean> => {
  return sendDiscordMessage({
    embeds: [
      {
        title: `🖥️ ${title}`,
        description,
        color: COLORS[type],
        fields,
        footer: {
          text: 'OptiClean Pro - Sistema de Monitoramento',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  });
};

// Alerta de CPU crítico
export const sendCpuAlert = async (usage: number): Promise<boolean> => {
  return sendSystemAlert(
    'Alerta de CPU',
    `⚠️ Uso de CPU está em **${usage}%**`,
    usage >= 90 ? 'error' : 'warning',
    [
      { name: 'Status', value: usage >= 90 ? '🔴 Crítico' : '🟡 Alto', inline: true },
      { name: 'Uso', value: `${usage}%`, inline: true },
    ]
  );
};

// Alerta de memória crítico
export const sendMemoryAlert = async (usage: number, used: number, total: number): Promise<boolean> => {
  return sendSystemAlert(
    'Alerta de Memória',
    `⚠️ Uso de RAM está em **${usage}%**`,
    usage >= 90 ? 'error' : 'warning',
    [
      { name: 'Status', value: usage >= 90 ? '🔴 Crítico' : '🟡 Alto', inline: true },
      { name: 'Uso', value: `${usage}%`, inline: true },
      { name: 'Detalhes', value: `${used}GB / ${total}GB`, inline: true },
    ]
  );
};

// Alerta de disco crítico
export const sendDiskAlert = async (usage: number, used: number, total: number): Promise<boolean> => {
  return sendSystemAlert(
    'Alerta de Disco',
    `⚠️ Espaço em disco está em **${usage}%**`,
    usage >= 90 ? 'error' : 'warning',
    [
      { name: 'Status', value: usage >= 90 ? '🔴 Crítico' : '🟡 Alto', inline: true },
      { name: 'Uso', value: `${usage}%`, inline: true },
      { name: 'Espaço', value: `${used}GB / ${total}GB`, inline: true },
    ]
  );
};

// Notificação de limpeza concluída
export const sendCleaningComplete = async (
  filesRemoved: number,
  spaceFreed: string
): Promise<boolean> => {
  return sendSystemAlert(
    'Limpeza Concluída',
    `✅ Limpeza do sistema finalizada com sucesso!`,
    'success',
    [
      { name: 'Arquivos Removidos', value: `${filesRemoved}`, inline: true },
      { name: 'Espaço Liberado', value: spaceFreed, inline: true },
    ]
  );
};

// Notificação de otimização concluída
export const sendOptimizationComplete = async (
  memoryFreed: string,
  processesOptimized: number
): Promise<boolean> => {
  return sendSystemAlert(
    'Otimização Concluída',
    `⚡ Otimização do sistema finalizada!`,
    'success',
    [
      { name: 'Memória Liberada', value: memoryFreed, inline: true },
      { name: 'Processos Otimizados', value: `${processesOptimized}`, inline: true },
    ]
  );
};

// Notificação de novo usuário
export const sendNewUserAlert = async (email: string): Promise<boolean> => {
  return sendSystemAlert(
    'Novo Usuário',
    `👤 Um novo usuário se registrou no sistema`,
    'info',
    [
      { name: 'Email', value: email, inline: true },
      { name: 'Data', value: new Date().toLocaleString('pt-BR'), inline: true },
    ]
  );
};

// Notificação de código de ativação usado
export const sendCodeUsedAlert = async (code: string, userEmail: string): Promise<boolean> => {
  return sendSystemAlert(
    'Código de Ativação Usado',
    `🔑 Um código de ativação foi utilizado`,
    'info',
    [
      { name: 'Código', value: code, inline: true },
      { name: 'Usuário', value: userEmail, inline: true },
    ]
  );
};

// Notificação de código prestes a expirar
export const sendCodeExpiringAlert = async (
  code: string,
  userEmail: string,
  daysRemaining: number
): Promise<boolean> => {
  return sendSystemAlert(
    'Código Prestes a Expirar',
    `⏰ Um código de ativação está prestes a expirar`,
    daysRemaining <= 3 ? 'error' : 'warning',
    [
      { name: 'Código', value: code, inline: true },
      { name: 'Usuário', value: userEmail, inline: true },
      { name: 'Dias Restantes', value: `${daysRemaining}`, inline: true },
    ]
  );
};

// Notificação de login
export const sendLoginAlert = async (
  email: string,
  ip: string,
  location: string,
  status: 'success' | 'failed'
): Promise<boolean> => {
  return sendSystemAlert(
    status === 'success' ? 'Login Bem-sucedido' : 'Tentativa de Login Falhou',
    status === 'success' 
      ? `✅ Um usuário fez login no sistema`
      : `❌ Tentativa de login falhou`,
    status === 'success' ? 'success' : 'error',
    [
      { name: 'Email', value: email, inline: true },
      { name: 'IP', value: ip || 'N/A', inline: true },
      { name: 'Localização', value: location || 'Desconhecida', inline: true },
    ]
  );
};

// Notificação de atualização disponível
export const sendUpdateAvailableAlert = async (version: string): Promise<boolean> => {
  return sendSystemAlert(
    'Atualização Disponível',
    `🆕 Uma nova versão do OptiClean Pro está disponível!`,
    'info',
    [
      { name: 'Nova Versão', value: version, inline: true },
    ]
  );
};

// Testar conexão com webhook
export const testWebhookConnection = async (): Promise<boolean> => {
  return sendDiscordMessage({
    embeds: [
      {
        title: '🔔 Teste de Conexão',
        description: 'Conexão com Discord configurada com sucesso!',
        color: COLORS.success,
        footer: {
          text: 'OptiClean Pro',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  });
};
