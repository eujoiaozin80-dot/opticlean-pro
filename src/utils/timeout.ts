/**
 * Utilitário para timeout em operações assíncronas
 */

export class TimeoutError extends Error {
  constructor(message = 'Operação excedeu o tempo limite') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Adiciona timeout a uma Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(errorMessage)),
        timeoutMs
      )
    ),
  ]);
}

