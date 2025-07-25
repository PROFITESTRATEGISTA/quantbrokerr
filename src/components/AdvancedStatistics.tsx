import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MonthlyResult {
  id: string;
  month: string;
  year: number;
  bitcoin: number | null;
  mini_indice: number | null;
  mini_dolar: number | null;
  portfolio: number | null;
  result_type: 'backtest' | 'live';
}

interface TradingStatistic {
  id: string;
  asset: string;
  year: number;
  profit_factor: number;
  recovery_factor: number;
  sharpe_ratio: number;
  payoff: number;
  avg_daily_gain: number;
  avg_daily_loss: number;
  daily_win_rate: number;
  max_drawdown: number;
  total_return: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
}

interface AdvancedStatisticsProps {
  data: MonthlyResult[];
  selectedYear: number;
  asset: string;
  isAdmin: boolean;
}

const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({
  data,
  selectedYear,
  asset,
  isAdmin
}) => {
  const [statistics, setStatistics] = useState<TradingStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const getAssetValue = (result: MonthlyResult, assetType: string): number | null => {
    switch (assetType) {
      case 'bitcoin': return result.bitcoin;
      case 'miniIndice': return result.mini_indice;
      case 'miniDolar': return result.mini_dolar;
      case 'portfolio': return result.portfolio;
      default: return null;
    }
  };

  const getAssetDisplayName = (assetType: string): string => {
    switch (assetType) {
      case 'bitcoin': return 'Bitcoin';
      case 'miniIndice': return 'Mini Índice';
      case 'miniDolar': return 'Mini Dólar';
      case 'portfolio': return 'Portfólio Completo';
      default: return assetType;
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data: stats, error } = await supabase
        .from('trading_statistics')
        .select('*')
        .eq('year', selectedYear);

      if (error) throw error;
      setStatistics(stats || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear]);

  // Calcular métricas automaticamente
  const calculateMetrics = () => {
    const filteredData = data.filter(d => d.year === selectedYear);
    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
    
    if (values.length === 0) {
      return {
        totalReturn: 0,
        avgWin: 0,
        avgLoss: 0,
        winRate: 0,
        profitFactor: 0,
        payoff: 0
      };
    }

    const positiveValues = values.filter(v => v > 0);
    const negativeValues = values.filter(v => v < 0);
    
    const totalReturn = values.reduce((sum, val) => sum + val, 0);
    const avgWin = positiveValues.length > 0 ? positiveValues.reduce((sum, val) => sum + val, 0) / positiveValues.length : 0;
    const avgLoss = negativeValues.length > 0 ? Math.abs(negativeValues.reduce((sum, val) => sum + val, 0) / negativeValues.length) : 0;
    const winRate = (positiveValues.length / values.length) * 100;
    const grossProfit = positiveValues.reduce((sum, val) => sum + val, 0);
    const grossLoss = Math.abs(negativeValues.reduce((sum, val) => sum + val, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    const payoff = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalReturn,
      avgWin,
      avgLoss,
      winRate,
      profitFactor,
      payoff
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                <div className="h-6 bg-slate-700 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Estatísticas Avançadas - {getAssetDisplayName(asset)} ({selectedYear})
        </h3>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Seção de Resumo */}
        <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700">
          <h4 className="text-lg font-semibold text-white mb-3">Resumo da Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Retorno Total:</span>
              <span className={`ml-2 font-semibold ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.totalReturn >= 0 ? '+' : ''}{formatNumber(metrics.totalReturn)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Meses Analisados:</span>
              <span className="ml-2 font-semibold text-blue-400">
                {data.filter(d => d.year === selectedYear && getAssetValue(d, asset) !== null).length}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Payoff Mensal:</span>
              <span className={`ml-2 font-semibold ${metrics.payoff >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                {formatNumber(metrics.payoff)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Retorno Médio Mensal:</span>
              <span className={`ml-2 font-semibold ${(metrics.totalReturn / Math.max(data.filter(d => d.year === selectedYear && getAssetValue(d, asset) !== null).length, 1)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatNumber(metrics.totalReturn / Math.max(data.filter(d => d.year === selectedYear && getAssetValue(d, asset) !== null).length, 1))}%
              </span>
            </div>
          </div>
          
          {/* Resumo Expandido */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Análise de Ganhos */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-green-400 font-semibold mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Análise de Ganhos Mensais
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Meses Positivos:</span>
                    <span className="text-green-400 font-medium">
                      {(() => {
                        const filteredData = data.filter(d => d.year === selectedYear);
                        const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                        return values.filter(v => v > 0).length;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ganho Médio:</span>
                    <span className="text-green-400 font-medium">
                      +{formatNumber(metrics.avgWin)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maior Ganho:</span>
                    <span className="text-green-400 font-medium">
                      +{(() => {
                        const filteredData = data.filter(d => d.year === selectedYear);
                        const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                        const positiveValues = values.filter(v => v > 0);
                        return positiveValues.length > 0 ? formatNumber(Math.max(...positiveValues)) : '0.00';
                      })()}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Análise de Perdas */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-red-400 font-semibold mb-2 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Análise de Perdas Mensais
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Meses Negativos:</span>
                    <span className="text-red-400 font-medium">
                      {(() => {
                        const filteredData = data.filter(d => d.year === selectedYear);
                        const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                        return values.filter(v => v < 0).length;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Perda Média:</span>
                    <span className="text-red-400 font-medium">
                      -{formatNumber(metrics.avgLoss)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maior Perda:</span>
                    <span className="text-red-400 font-medium">
                      {(() => {
                        const filteredData = data.filter(d => d.year === selectedYear);
                        const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                        const negativeValues = values.filter(v => v < 0);
                        return negativeValues.length > 0 ? formatNumber(Math.min(...negativeValues)) : '0.00';
                      })()}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Métricas de Consistência */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h5 className="text-blue-400 font-semibold mb-2 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Consistência Mensal
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxa de Acerto:</span>
                    <span className={`font-medium ${metrics.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatNumber(metrics.winRate)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fator de Lucro Mensal:</span>
                    <span className={`font-medium ${metrics.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatNumber(metrics.profitFactor)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Meses Positivos Consecutivos:</span>
                    <span className="text-blue-400 font-medium">
                      {(() => {
                        const filteredData = data.filter(d => d.year === selectedYear);
                        const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                        
                        let maxSequence = 0;
                        let currentSequence = 0;
                        
                        values.forEach(value => {
                          if (value > 0) {
                            currentSequence++;
                            maxSequence = Math.max(maxSequence, currentSequence);
                          } else {
                            currentSequence = 0;
                          }
                        });
                        
                        return maxSequence;
                      })()} meses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStatistics;