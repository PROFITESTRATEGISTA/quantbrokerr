/*
  # Corrigir políticas de alavancagem para admin

  1. Políticas Atualizadas
    - Admin pode atualizar qualquer usuário
    - Usuários podem atualizar seus próprios perfis
    - Leitura pública para usuários autenticados

  2. Segurança
    - Mantém RLS habilitado
    - Admin tem controle total
    - Usuários só editam próprios dados
*/

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admin pode acessar todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "authenticated_read_profiles" ON user_profiles;
DROP POLICY IF EXISTS "users_manage_own_profile" ON user_profiles;

-- Política para admin ter acesso total
CREATE POLICY "Admin tem acesso total aos perfis"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  )
  WITH CHECK (
    (jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text
  );

-- Política para usuários lerem todos os perfis
CREATE POLICY "Usuários podem ler perfis"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para usuários editarem seus próprios perfis
CREATE POLICY "Usuários podem editar próprio perfil"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para usuários criarem seus próprios perfis
CREATE POLICY "Usuários podem criar próprio perfil"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);