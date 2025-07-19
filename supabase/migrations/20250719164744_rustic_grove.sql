/*
  # Adicionar campo tipo de resultado

  1. Alterações na tabela
    - Adicionar coluna `result_type` na tabela `monthly_results`
    - Valores permitidos: 'backtest' ou 'live'
    - Valor padrão: 'live' (mercado ao vivo)

  2. Segurança
    - Manter políticas RLS existentes
    - Adicionar constraint para validar valores
*/

-- Adicionar coluna result_type na tabela monthly_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'monthly_results' AND column_name = 'result_type'
  ) THEN
    ALTER TABLE monthly_results 
    ADD COLUMN result_type text DEFAULT 'live' NOT NULL;
  END IF;
END $$;

-- Adicionar constraint para validar valores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'monthly_results_result_type_check'
  ) THEN
    ALTER TABLE monthly_results 
    ADD CONSTRAINT monthly_results_result_type_check 
    CHECK (result_type IN ('backtest', 'live'));
  END IF;
END $$;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_monthly_results_result_type 
ON monthly_results(result_type);

-- Comentário na coluna
COMMENT ON COLUMN monthly_results.result_type IS 'Tipo do resultado: backtest ou mercado ao vivo';