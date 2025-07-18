/*
  # Corrigir permissões da tabela users

  1. Policies
    - Remove policies existentes problemáticas
    - Adiciona policy para admin acessar todos os usuários
    - Adiciona policy para usuários acessarem seus próprios dados

  2. Função RPC
    - Cria função segura para buscar usuários com profiles
    - Verifica se é admin antes de retornar dados

  3. Segurança
    - Mantém RLS habilitado
    - Acesso restrito apenas ao necessário
*/

-- Remove policies existentes da tabela users se existirem
DROP POLICY IF EXISTS "Admin pode acessar todos os usuários" ON auth.users;
DROP POLICY IF EXISTS "Usuários podem acessar seus próprios dados" ON auth.users;
DROP POLICY IF EXISTS "admin_read_all_users" ON auth.users;
DROP POLICY IF EXISTS "users_read_own_data" ON auth.users;

-- Habilita RLS na tabela users (caso não esteja habilitado)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Policy para admin acessar todos os usuários
CREATE POLICY "admin_full_access_users" ON auth.users
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  )
  WITH CHECK (
    (auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Policy para usuários acessarem apenas seus próprios dados
CREATE POLICY "users_own_data_only" ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Remove função existente se existir
DROP FUNCTION IF EXISTS get_all_users_with_profiles();

-- Cria função RPC segura para buscar usuários com profiles
CREATE OR REPLACE FUNCTION get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  phone text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  leverage_multiplier integer,
  is_active boolean,
  contracted_plan text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário é admin
  IF (auth.jwt() ->> 'email'::text) != 'pedropardal04@gmail.com'::text THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
  END IF;

  -- Retorna dados combinados de auth.users e user_profiles
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.phone,
    COALESCE(p.full_name, '') as full_name,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.phone_confirmed_at,
    COALESCE(p.leverage_multiplier, 1) as leverage_multiplier,
    COALESCE(p.is_active, true) as is_active,
    COALESCE(p.contracted_plan, 'none') as contracted_plan
  FROM auth.users u
  LEFT JOIN user_profiles p ON u.id = p.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_all_users_with_profiles() TO authenticated;