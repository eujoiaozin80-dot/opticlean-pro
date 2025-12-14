-- Adicionar novos roles ao enum (se ainda não existirem)
-- Nota: PostgreSQL não permite adicionar valores a ENUMs facilmente
-- Esta migration assume que o enum será atualizado manualmente ou via ALTER TYPE

-- Se precisar adicionar novos roles, execute:
-- ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
-- ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- Por enquanto, vamos manter apenas 'founder' e 'user'
-- Os novos roles podem ser implementados como strings no código TypeScript
-- e validados via RLS policies

