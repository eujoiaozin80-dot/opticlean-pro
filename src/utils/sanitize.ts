/**
 * Utilitários de sanitização para prevenir XSS
 */

/**
 * Sanitiza string para exibição segura em HTML
 */
export const sanitizeForDisplay = (input: string): string => {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitiza para uso em atributos HTML
 */
export const sanitizeForAttribute = (input: string): string => {
  return sanitizeForDisplay(input).replace(/\s+/g, ' ').trim();
};

