import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Settings, Edit3, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  volatility: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
}

interface AdvancedStatisticsProps {
  data: any[];
  selectedYear: number;
  asset: string;
  availableYears: number[];
  isAdmin: boolean;
}

const AdvancedStatistics: React.FC<AdvancedStatisticsProps> = ({
  data,
  selectedYear,
  asset,
  availableYears,
  isAdmin
}) => {
  const [statistics, setStatistics] = useState<TradingStatistic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

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
      setError(null);
      
      const { data: stats, error } = await supabase
        .from('trading_statistics')
        .select('*')
        .eq('asset', asset)
        .eq('year', selectedYear)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (stats) {
        setStatistics(stats);
      } else {
        // Criar estatística padrão se não existir
        const defaultStats = {
          asset,
          year: selectedYear,
          profit_factor: 1.33,
          recovery_factor: 6.82,
          sharpe_ratio: 2.61,
          payoff: 1.64,
          avg_daily_gain: 437.42,
          avg_daily_loss: 287.32,
          daily_win_rate: 52.0,
          max_drawdown: 14.28,
          total_return: 126.35,
          volatility: 18.5,
          win_rate: 85.71,
          avg_win: 23.44,
          avg_loss: 14.28
        };

        const { data: newStats, error: insertError } = await supabase
          .from('trading_statistics')
          .insert([defaultStats])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default statistics:', insertError);
          setStatistics(null);
        } else {
          setStatistics(newStats);
        }
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Erro ao carregar estatísticas');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [asset, selectedYear]);

  const handleEditField = (fieldKey: string, currentValue: number) => {
    setEditingField(fieldKey);
    setEditValue(currentValue.toString());
  };

  const handleSaveField = async () => {
    if (!statistics || !editingField) return;

    try {
      setSaving(true);
      setError(null);
      
      const newValue = parseFloat(editValue);
      
      if (isNaN(newValue) || !isFinite(newValue)) {
        setError('Valor inválido. Use números decimais (ex: 12.5)');
        return;
      }

      const { error } = await supabase
        .from('trading_statistics')
        .update({ [editingField]: newValue })
        .eq('id', statistics.id);

      if (error) throw error;

      // Atualizar estado local
      setStatistics({
        ...statistics,
        [editingField]: newValue
      });

      setEditingField(null);
      setEditValue('');
    } catch (error: any) {
      console.error('Error saving field:', error);
      setError(error.message || 'Erro ao salvar valor');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setError(null);
  };

  const renderEditableValue = (
    fieldKey: string, 
    value: number,
    colorClass: string,
    prefix: string = '',
    suffix: string = ''
  ) => {
    if (isAdmin && editingField === fieldKey) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-24 px-2 py-1 text-xs bg-slate-700 border border-slate-500 rounded text-white focus:border-blue-500 focus:outline-none"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveField();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
          />
          <button
            onClick={handleSaveField}
            disabled={saving}
            className="p-1 bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
            title="Salvar"
          >
            <Save className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            title="Cancelar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      );
    }

    const displayValue = `${prefix}${value.toFixed(2)}${suffix}`;

    return (
      <span 
        className={`${colorClass} ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''} group flex items-center`}
        onClick={() => isAdmin && handleEditField(fieldKey, value)}
        title={isAdmin ? "Clique para editar" : undefined}
      >
        {displayValue}
        {isAdmin && (
          <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/60 via-blue-900/40 to-teal-900/30 rounded-xl p-6 border border-slate-700">
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

  if (!statistics) {
    return (
      <div className="bg-gradient-to-br from-slate-800/60 via-blue-900/40 to-teal-900/30 rounded-xl p-6 border border-slate-700">
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Sem Estatísticas Disponíveis
          </h3>
          <p className="text-slate-400 mb-4">
            Não há dados estatísticos para {getAssetDisplayName(asset)} em {selectedYear}
          </p>
          {isAdmin && (
            <button
              onClick={fetchStatistics}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Criar Estatísticas Padrão
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/60 via-blue-900/40 to-teal-900/30 rounded-xl p-6 border border-slate-700 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Estatísticas Avançadas - {getAssetDisplayName(asset)} ({selectedYear})
        </h3>
        {isAdmin && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Settings className="w-4 h-4" />
            <span>Clique nos valores para editar</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Seção de Resumo */}
        <div className="bg-gradient-to-br from-slate-800/40 via-blue-900/30 to-teal-900/20 rounded-xl p-4 border border-slate-600/50">
          <h4 className="text-lg font-semibold text-white mb-3">Resumo da Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Retorno Total:</span>
              {renderEditableValue(
                'total_return',
                statistics.total_return,
                `ml-2 font-semibold ${statistics.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`,
                statistics.total_return >= 0 ? '+' : '',
                '%'
              )}
            </div>
            <div>
              <span className="text-slate-400">Taxa de Acerto:</span>
              {renderEditableValue(
                'win_rate',
                statistics.win_rate,
                'ml-2 font-semibold text-blue-400',
                '',
                '%'
              )}
            </div>
            <div>
              <span className="text-slate-400">Payoff Mensal:</span>
              {renderEditableValue(
                'payoff',
                statistics.payoff,
                `ml-2 font-semibold ${statistics.payoff >= 1 ? 'text-green-400' : 'text-red-400'}`
              )}
            </div>
            <div>
              <span className="text-slate-400">Max Drawdown:</span>
              {renderEditableValue(
                'max_drawdown',
                statistics.max_drawdown,
                'ml-2 font-semibold text-red-400',
                '-',
                '%'
              )}
            </div>
            <div>
              <span className="text-slate-400">Fator de Lucro:</span>
              {renderEditableValue(
                'profit_factor',
                statistics.profit_factor,
                `ml-2 font-semibold ${statistics.profit_factor >= 1 ? 'text-green-400' : 'text-red-400'}`
              )}
            </div>
            <div>
              <span className="text-slate-400">Sharpe Ratio:</span>
              {renderEditableValue(
                'sharpe_ratio',
                statistics.sharpe_ratio,
                `ml-2 font-semibold ${statistics.sharpe_ratio >= 1 ? 'text-green-400' : 'text-blue-400'}`
              )}
            </div>
            <div>
              <span className="text-slate-400">Fator de Recuperação:</span>
              {renderEditableValue(
                'recovery_factor',
                statistics.recovery_factor,
                `ml-2 font-semibold ${statistics.recovery_factor >= 1 ? 'text-green-400' : 'text-red-400'}`
              )}
            </div>
            <div>
              <span className="text-slate-400">Volatilidade:</span>
              {renderEditableValue(
                'volatility',
                statistics.volatility,
                'ml-2 font-semibold text-blue-400',
                '',
                '%'
              )}
            </div>
          </div>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Análise de Ganhos */}
          <div className="bg-gradient-to-br from-green-900/20 via-slate-800/40 to-blue-900/20 rounded-lg p-4 border border-green-500/20">
            <h5 className="text-green-400 font-semibold mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Análise de Ganhos
            </h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ganho Médio:</span>
                {renderEditableValue(
                  'avg_win',
                  statistics.avg_win,
                  'text-green-400 font-medium',
                  '+',
                  '%'
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ganho Médio Diário:</span>
                {renderEditableValue(
                  'avg_daily_gain',
                  statistics.avg_daily_gain,
                  'text-green-400 font-medium',
                  'R$ '
                )}
              </div>
            </div>
          </div>

          {/* Análise de Perdas */}
          <div className="bg-gradient-to-br from-red-900/20 via-slate-800/40 to-blue-900/20 rounded-lg p-4 border border-red-500/20">
            <h5 className="text-red-400 font-semibold mb-3 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Análise de Perdas
            </h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Perda Média:</span>
                {renderEditableValue(
                  'avg_loss',
                  statistics.avg_loss,
                  'text-red-400 font-medium',
                  '-',
                  '%'
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Perda Média Diária:</span>
                {renderEditableValue(
                  'avg_daily_loss',
                  statistics.avg_daily_loss,
                  'text-red-400 font-medium',
                  'R$ '
                )}
              </div>
            </div>
          </div>

          {/* Consistência Mensal */}
          <div className="bg-gradient-to-br from-blue-900/20 via-slate-800/40 to-cyan-900/20 rounded-lg p-4 border border-blue-500/20">
            <h5 className="text-blue-400 font-semibold mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Consistência
            </h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Taxa de Acerto Diária:</span>
                {renderEditableValue(
                  'daily_win_rate',
                  statistics.daily_win_rate,
                  `font-medium ${statistics.daily_win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`,
                  '',
                  '%'
                )}
              </div>
            </div>
          </div>

          {/* Performance Extrema */}
          <div className="bg-gradient-to-br from-purple-900/20 via-slate-800/40 to-teal-900/20 rounded-lg p-4 border border-purple-500/20">
            <h5 className="text-purple-400 font-semibold mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance Extrema
            </h5>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Ganho Máximo Diário:</span>
                <span className="text-green-400 font-medium">R$ 1.917,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Perda Máxima Diária:</span>
                <span className="text-red-400 font-medium">R$ 600,00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStatistics;