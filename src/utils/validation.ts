/**
 * Validação de inputs e sanitização
 */

/**
 * Valida se um PID é válido
 */
export function validatePid(pid: unknown): number {
  if (typeof pid !== 'number' && typeof pid !== 'string') {
    throw new Error('PID deve ser um número ou string');
  }

  const pidNum = typeof pid === 'string' ? parseInt(pid, 10) : pid;

  if (isNaN(pidNum) || pidNum <= 0 || pidNum > 65535) {
    throw new Error('PID inválido. Deve ser um número entre 1 e 65535');
  }

  return pidNum;
}

/**
 * Sanitiza uma string removendo caracteres perigosos
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Input deve ser uma string');
  }

  // Remover caracteres perigosos para command injection
  return input.replace(/[;&|`$(){}[\]<>]/g, '').trim();
}

/**
 * Valida nome de processo
 */
export function validateProcessName(name: unknown): string {
  if (typeof name !== 'string') {
    throw new Error('Nome do processo deve ser uma string');
  }

  const sanitized = sanitizeString(name);

  if (sanitized.length === 0 || sanitized.length > 255) {
    throw new Error('Nome do processo inválido');
  }

  return sanitized;
}

/**
 * Valida nome de serviço do Windows
 */
export function validateServiceName(serviceName: unknown): string {
  if (typeof serviceName !== 'string') {
    throw new Error('Nome do serviço deve ser uma string');
  }

  // Nome de serviço deve conter apenas letras, números, hífen e underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(serviceName)) {
    throw new Error('Nome de serviço inválido');
  }

  return serviceName;
}

/**
 * Valida caminho de arquivo/pasta
 */
export function validatePath(filePath: unknown): string {
  if (typeof filePath !== 'string') {
    throw new Error('Caminho deve ser uma string');
  }

  // Remover caracteres perigosos
  const sanitized = filePath.replace(/[;&|`$(){}[\]<>]/g, '').trim();

  if (sanitized.length === 0) {
    throw new Error('Caminho inválido');
  }

  return sanitized;
}

