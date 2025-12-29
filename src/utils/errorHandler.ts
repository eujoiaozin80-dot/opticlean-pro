/**
 * Utilitário centralizado para tratamento de erros
 */

export interface ErrorContext {
  context: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Log de erro (pode ser expandido para enviar para serviço externo)
 */
function logError(error: unknown, context: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log no console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('[ErrorHandler]', {
      message: errorMessage,
      stack: errorStack,
      context: context.context,
      additionalData: context.additionalData,
    });
  }

  // TODO: Integrar com serviço de logging (Sentry, etc)
  // logToService(error, context);
}

/**
 * Trata erro e exibe toast amigável
 */
export function handleProcessError(
  error: unknown,
  context: string,
  additionalData?: Record<string, unknown>
): void {
  const errorMessage =
    error instanceof Error ? error.message : 'Erro desconhecido';

  logError(error, {
    context,
    additionalData,
  });

  // Não exibir toast aqui - deixar para o componente tratar
  console.error(`Erro ao ${context}: ${errorMessage}`);
}

/**
 * Trata erro silenciosamente (apenas log)
 */
export function handleErrorSilently(
  error: unknown,
  context: string,
  additionalData?: Record<string, unknown>
): void {
  logError(error, {
    context,
    additionalData,
  });
}

