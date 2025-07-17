/*
  # Reset para Modo de Produção

  1. Limpeza de Dados
    - Remove todos os resultados mensais fictícios da tabela `monthly_results`
    - Remove todas as estatísticas de trading da tabela `trading_statistics`
    - Mantém a estrutura das tabelas intacta
    - Mantém as políticas RLS ativas

  2. Preparação para Produção
    - Sistema pronto para receber dados reais via interface administrativa
    - Todas as funcionalidades mantidas
    - Dados zerados para início limpo

  IMPORTANTE: Esta migração remove TODOS os dados de resultados.
  Execute apenas quando tiver certeza de que quer zerar tudo para produção.
*/

-- Limpar todos os resultados mensais
DELETE FROM monthly_results;

-- Limpar todas as estatísticas de trading
DELETE FROM trading_statistics;

-- Resetar sequências se necessário (opcional)
-- ALTER SEQUENCE IF EXISTS monthly_results_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS trading_statistics_id_seq RESTART WITH 1;

-- Confirmar que as tabelas estão vazias
DO $$
BEGIN
  RAISE NOTICE 'Dados removidos com sucesso!';
  RAISE NOTICE 'monthly_results: % registros', (SELECT COUNT(*) FROM monthly_results);
  RAISE NOTICE 'trading_statistics: % registros', (SELECT COUNT(*) FROM trading_statistics);
  RAISE NOTICE 'Sistema pronto para modo de produção!';
END $$;