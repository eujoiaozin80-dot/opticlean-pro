import { useMemo } from 'react';

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export const usePasswordStrength = (password: string) => {
  const strength = useMemo((): PasswordStrength => {
    if (password.length === 0) return 'weak';

    let score = 0;

    // Comprimento
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Caracteres minúsculos
    if (/[a-z]/.test(password)) score++;

    // Caracteres maiúsculos
    if (/[A-Z]/.test(password)) score++;

    // Números
    if (/\d/.test(password)) score++;

    // Caracteres especiais
    if (/[^a-zA-Z\d]/.test(password)) score++;

    // Variedade de caracteres
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.6) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'fair';
    if (score <= 6) return 'good';
    return 'strong';
  }, [password]);

  const strengthColor = useMemo(() => {
    switch (strength) {
      case 'weak': return 'text-red-500';
      case 'fair': return 'text-orange-500';
      case 'good': return 'text-yellow-500';
      case 'strong': return 'text-emerald-500';
    }
  }, [strength]);

  const strengthBg = useMemo(() => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-orange-500';
      case 'good': return 'bg-yellow-500';
      case 'strong': return 'bg-emerald-500';
    }
  }, [strength]);

  const strengthLabel = useMemo(() => {
    switch (strength) {
      case 'weak': return 'Fraca';
      case 'fair': return 'Razoável';
      case 'good': return 'Boa';
      case 'strong': return 'Forte';
    }
  }, [strength]);

  return {
    strength,
    strengthColor,
    strengthBg,
    strengthLabel,
  };
};

