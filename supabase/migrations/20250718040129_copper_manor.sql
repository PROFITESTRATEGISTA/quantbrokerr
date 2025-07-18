/*
  # Corrigir policies RLS para resolver erro de permissão

  1. Problemas identificados
    - Policy da tabela financial_costs referencia tabela users que não tem policy adequada
    - Falta policy para admin acessar user_profiles
    - Policy atual usa função email() que pode não estar funcionando

  2. Soluções
    - Simplificar policy da financial_costs para usar auth.jwt()
    - Adicionar policy para admin acessar user_profiles
    - Garantir que todas as tabelas tenham policies adequadas

  3. Segurança
    - Manter RLS habilitado
    - Acesso restrito apenas ao admin
    - Verificação por email do JWT
*/

-- Remover policies problemáticas existentes
DROP POLICY IF EXISTS "Admin pode gerenciar custos financeiros" ON financial_costs;
DROP POLICY IF EXISTS "Only admin can get all users" ON user_profiles;
DROP POLICY IF EXISTS "admin_full_access_email" ON user_profiles;

-- Criar policy simplificada para financial_costs usando auth.jwt()
CREATE POLICY "Admin pode gerenciar custos financeiros"
  ON financial_costs
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Criar policy para admin acessar user_profiles
CREATE POLICY "Admin pode acessar todos os perfis"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Garantir que RLS está habilitado nas tabelas necessárias
ALTER TABLE financial_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;