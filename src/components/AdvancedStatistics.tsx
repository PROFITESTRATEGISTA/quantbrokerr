import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Edit3, Save, X, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MonthlyResult {
  id: string;
  month: string;
  year: number;
  bitcoin: number | null;
  miniIndice: number | null;
  miniDolar: number | null;
  portfolio: number | null;
  resultType: 'backtest' | 'live';
}

interface TradingStatistics {
  id: string;
  asset: string;
  year: number;
  profitFactor: number;
  recoveryFactor: number;
  sharpeRatio: number;
  payoff: number;
  avgDailyGain: number;
  avgDailyLoss: number;
  dailyWinRate: number;
  maxDrawdown: number;
  totalReturn: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

interface AdvancedStatisticsProps {
  data: MonthlyResult[];
  asset: string;
  selectedYear: number;
  isAdmin: boolean;
}

const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({
  data,
  asset,
  selectedYear,
  isAdmin
}) => {
  const [statistics, setStatistics] = useState<TradingStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState(false);
  const [editingFields, setEditingFields] = useState(false);

  const getAssetValue = (result: MonthlyResult, assetType: string): number | null => {
    switch (assetType) {
      case 'bitcoin': return result.bitcoin;
      case 'miniIndice': return result.miniIndice;
      case 'miniDolar': return result.miniDolar;
      case 'portfolio': return result.portfolio;
      default: return null;
    }
  };

  const formatNumber = (value: number): string => {
    return value.toFixed(2);
  };

  const calculateMetrics = (): TradingStatistics => {
    const filteredData = data.filter(d => d.year === selectedYear);
    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
    
    if (values.length === 0) {
      return {
        id: '',
        asset,
        year: selectedYear,
        profitFactor: 0,
        recoveryFactor: 0,
        sharpeRatio: 0,
        payoff: 0,
        avgDailyGain: 0,
        avgDailyLoss: 0,
        dailyWinRate: 0,
        maxDrawdown: 0,
        totalReturn: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0
      };
    }

    const positiveValues = values.filter(v => v > 0);
    const negativeValues = values.filter(v => v < 0);
    
    const totalReturn = values.reduce((sum, val) => sum + val, 0);
    const avgWin = positiveValues.length > 0 ? positiveValues.reduce((sum, val) => sum + val, 0) / positiveValues.length : 0;
    const avgLoss = negativeValues.length > 0 ? Math.abs(negativeValues.reduce((sum, val) => sum + val, 0) / negativeValues.length) : 0;
    const winRate = (positiveValues.length / values.length) * 100;
    const payoff = avgLoss > 0 ? avgWin / avgLoss : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * positiveValues.length) / (avgLoss * negativeValues.length) : 0;
    const maxDrawdown = values.length > 0 ? Math.min(...values) : 0;

    return {
      id: statistics?.id || '',
      asset,
      year: selectedYear,
      profitFactor,
      recoveryFactor: 0,
      sharpeRatio: 0,
      payoff,
      avgDailyGain: 0,
      avgDailyLoss: 0,
      dailyWinRate: 0,
      maxDrawdown: Math.abs(maxDrawdown),
      totalReturn,
      winRate,
      avgWin,
      avgLoss
    };
  };

  const metrics = calculateMetrics();

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data: stats, error } = await supabase
        .from('trading_statistics')
        .select('*')
        .eq('asset', asset)
        .eq('year', selectedYear)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setStatistics(stats || null);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [asset, selectedYear]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Estatísticas Avançadas</h3>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditingValues(!editingValues)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Editar valores"
            >
              <Edit3 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setEditingFields(!editingFields)}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              title="Editar campos"
            >
              <Settings className="h-4 w-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Fator de Lucro */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-slate-300 text-sm font-medium">Fator de Lucro</span>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {formatNumber(metrics.profitFactor)}
          </div>
          <div className="text-xs text-slate-400">
            Lucro Bruto / Perda Bruta
          </div>
          <div className="text-xs text-slate-500 mt-1">
            > 1.5 (Bom)
          </div>
        </div>

        {/* Payoff */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center mb-2">
            <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
            <span className="text-slate-300 text-sm font-medium">Payoff</span>
          </div>
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {formatNumber(metrics.payoff)}
          </div>
          <div className="text-xs text-slate-400">
            Ganho Médio / Perda Média
          </div>
          <div className="text-xs text-slate-500 mt-1">
            > 1.0 (Bom)
          </div>
        </div>

        {/* Taxa de Acerto */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-slate-300 text-sm font-medium">Taxa de Acerto</span>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-1">
            {formatNumber(metrics.winRate)}%
          </div>
          <div className="text-xs text-slate-400">
            Percentual de meses positivos
          </div>
          <div className="text-xs text-slate-500 mt-1">
            > 50% (Bom)
          </div>
        </div>

        {/* Drawdown Máximo */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center mb-2">
            <TrendingDown className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-slate-300 text-sm font-medium">Drawdown Máximo</span>
          </div>
          <div className="text-2xl font-bold text-red-400 mb-1">
            {formatNumber(metrics.maxDrawdown)}%
          </div>
          <div className="text-xs text-slate-400">
            Maior perda acumulada
          </div>
          <div className="text-xs text-slate-500 mt-1">
            < 10% (Bom)
          </div>
        </div>
      </div>

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
                Análise de Ganhos
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
                Análise de Perdas
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
                Consistência
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa de Acerto:</span>
                  <span className={`font-medium ${metrics.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNumber(metrics.winRate)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fator de Lucro:</span>
                  <span className={`font-medium ${metrics.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatNumber(metrics.profitFactor)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sequência Máx:</span>
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
  );
};

export default AdvancedStatistics;