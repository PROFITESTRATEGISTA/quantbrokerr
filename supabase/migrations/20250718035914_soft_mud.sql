/*
  # Corrigir policies da tabela users

  1. Políticas de Segurança
    - Permitir que admin leia dados dos usuários
    - Manter segurança para usuários normais
    - Permitir acesso aos dados necessários para o painel admin

  2. Alterações
    - Adicionar policy para admin ler todos os usuários
    - Manter policies existentes para usuários normais
*/

-- Habilitar RLS na tabela users se não estiver habilitado
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes que podem estar conflitando
DROP POLICY IF EXISTS "Admin can read all users" ON auth.users;
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;

-- Policy para admin ler todos os usuários
CREATE POLICY "Admin can read all users"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.email = 'pedropardal04@gmail.com'
    )
  );

-- Policy para usuários lerem apenas seus próprios dados
CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Garantir que a função get_all_users_with_profiles funcione
CREATE OR REPLACE FUNCTION get_all_users_with_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  full_name text,
  leverage_multiplier integer,
  is_active boolean,
  contracted_plan text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.email = 'pedropardal04@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Retornar dados combinados de auth.users e user_profiles
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.phone::text,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    u.phone_confirmed_at,
    COALESCE(up.full_name, '')::text as full_name,
    COALESCE(up.leverage_multiplier, 1) as leverage_multiplier,
    COALESCE(up.is_active, true) as is_active,
    COALESCE(up.contracted_plan, 'none')::text as contracted_plan
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Garantir que o admin tenha acesso à função
GRANT EXECUTE ON FUNCTION get_all_users_with_profiles() TO authenticated;