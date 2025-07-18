/*
  # Corrigir integração de contratos e políticas RLS

  1. Corrigir políticas RLS com função auth.jwt() correta
  2. Adicionar índices para performance
  3. Corrigir constraints e validações
  4. Garantir integridade referencial
*/

-- Remover políticas antigas com função incorreta
DROP POLICY IF EXISTS "Admin pode gerenciar contratos" ON client_contracts;
DROP POLICY IF EXISTS "Permitir leitura pública de contratos" ON client_contracts;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios contratos" ON client_contracts;

-- Criar políticas corretas com auth.jwt()
CREATE POLICY "Admin pode gerenciar todos os contratos"
  ON client_contracts
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'pedropardal04@gmail.com'::text);

-- Política para usuários verem seus próprios contratos
CREATE POLICY "Usuários podem ver seus próprios contratos"
  ON client_contracts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_user_id ON client_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_plan_type ON client_contracts(plan_type);
CREATE INDEX IF NOT EXISTS idx_client_contracts_billing_period ON client_contracts(billing_period);
CREATE INDEX IF NOT EXISTS idx_client_contracts_is_active ON client_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_client_contracts_created_at ON client_contracts(created_at);

-- Garantir que constraints estão corretas
DO $$
BEGIN
  -- Verificar se constraint de valor positivo existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'client_contracts_monthly_value_check'
  ) THEN
    ALTER TABLE client_contracts 
    ADD CONSTRAINT client_contracts_monthly_value_check 
    CHECK (monthly_value > 0);
  END IF;

  -- Verificar se constraint de datas existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'client_contracts_date_check'
  ) THEN
    ALTER TABLE client_contracts 
    ADD CONSTRAINT client_contracts_date_check 
    CHECK (contract_end >= contract_start);
  END IF;
END $$;