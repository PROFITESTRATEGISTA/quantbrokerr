/*
  # Adicionar dados de exemplo com problemas

  1. Dados de Exemplo
    - Resultados mensais realistas com ganhos e perdas
    - Diferentes tipos de resultado (backtest e live)
    - Dados para 2024 e 2025
    
  2. Cenários Incluídos
    - Meses positivos e negativos
    - Drawdowns realistas
    - Variação entre ativos
    - Resultados de backtest vs mercado real
*/

-- Inserir dados de exemplo para 2024 (backtest)
INSERT INTO monthly_results (month, year, bitcoin, mini_indice, mini_dolar, portfolio, result_type) VALUES
('Janeiro', 2024, 12.4, 8.2, 15.1, 11.9, 'backtest'),
('Fevereiro', 2024, -8.7, -5.3, -12.1, -8.7, 'backtest'),
('Março', 2024, 18.9, 12.6, 22.3, 17.9, 'backtest'),
('Abril', 2024, 6.2, 4.8, 9.1, 6.7, 'backtest'),
('Maio', 2024, -15.3, -9.8, -18.7, -14.6, 'backtest'),
('Junho', 2024, 21.7, 16.4, 28.2, 22.1, 'backtest'),
('Julho', 2024, 3.8, 2.1, 5.9, 3.9, 'backtest'),
('Agosto', 2024, -11.2, -7.6, -14.8, -11.2, 'backtest'),
('Setembro', 2024, 14.6, 11.3, 19.4, 15.1, 'backtest'),
('Outubro', 2024, 7.9, 5.7, 10.2, 7.9, 'backtest'),
('Novembro', 2024, -6.4, -4.1, -8.9, -6.3, 'backtest'),
('Dezembro', 2024, 19.8, 14.2, 25.6, 19.9, 'backtest');

-- Inserir dados de exemplo para 2025 (mercado real)
INSERT INTO monthly_results (month, year, bitcoin, mini_indice, mini_dolar, portfolio, result_type) VALUES
('Janeiro', 2025, -2.1, 1.8, -4.3, -1.5, 'live'),
('Fevereiro', 2025, 8.7, 6.2, 11.4, 8.8, 'live'),
('Março', 2025, -12.8, -8.9, -15.7, -12.5, 'live'),
('Abril', 2025, 15.3, 11.7, 18.9, 15.3, 'live'),
('Maio', 2025, 0.0, 0.0, 0.0, 0.0, 'live');

-- Inserir estatísticas avançadas para Bitcoin 2024
INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'bitcoin', 2024, 1.85, 3.2, 1.4, 1.6,
  0.8, 1.2, 58.3, 15.3, 62.1, 12.8, 66.7, 14.2, 10.4
);

-- Inserir estatísticas avançadas para Mini Índice 2024
INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'miniIndice', 2024, 2.1, 4.1, 1.6, 1.8,
  0.6, 0.9, 66.7, 9.8, 52.3, 9.2, 75.0, 10.8, 6.9
);

-- Inserir estatísticas avançadas para Mini Dólar 2024
INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'miniDolar', 2024, 1.7, 2.8, 1.2, 1.4,
  1.0, 1.5, 58.3, 18.7, 71.3, 15.6, 66.7, 16.9, 12.2
);

-- Inserir estatísticas avançadas para Portfólio Completo 2024
INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'portfolio', 2024, 1.95, 3.6, 1.5, 1.7,
  0.7, 1.0, 66.7, 14.6, 63.4, 11.1, 75.0, 13.2, 8.9
);

-- Inserir estatísticas para 2025 (dados parciais - mercado real)
INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'bitcoin', 2025, 1.2, 1.8, 0.8, 1.1,
  0.5, 0.9, 60.0, 12.8, 9.1, 8.7, 60.0, 11.9, 8.4
);

INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'miniIndice', 2025, 1.6, 2.3, 1.1, 1.4,
  0.4, 0.6, 80.0, 8.9, 10.8, 6.2, 80.0, 8.9, 6.4
);

INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'miniDolar', 2025, 1.1, 1.5, 0.7, 1.0,
  0.6, 1.1, 60.0, 15.7, 10.3, 10.8, 60.0, 15.1, 12.8
);

INSERT INTO trading_statistics (
  asset, year, profit_factor, recovery_factor, sharpe_ratio, payoff,
  avg_daily_gain, avg_daily_loss, daily_win_rate, max_drawdown,
  total_return, volatility, win_rate, avg_win, avg_loss
) VALUES (
  'portfolio', 2025, 1.4, 2.1, 0.9, 1.2,
  0.5, 0.8, 80.0, 12.5, 10.1, 7.9, 80.0, 11.7, 9.1
);