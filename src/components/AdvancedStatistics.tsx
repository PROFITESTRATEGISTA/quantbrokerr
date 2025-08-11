import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Edit3, Save, X } from 'lucide-react';

interface MonthlyResult {
  id: string;
  month: string;
  year: number;
  bitcoin: number | null;
  mini_indice: number | null;
  mini_dolar: number | null;
  portfolio: number | null;
  result_type: string;
  created_at: string;
  updated_at: string;
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
  const [assetStatistics, setAssetStatistics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Valores padrão para cada ativo
  const defaultStatistics = {
    bitcoin: {
      profitFactor: '1.25',
      sharpeRatio: '2.15',
      recoveryFactor: '5.80',
      avgDailyGain: 'R$ 380,50',
      maxDailyGain: 'R$ 1.650,00',
      avgDailyLoss: 'R$ 245,30',
      maxDailyLoss: 'R$ 520,00',
      dailyWinRate: '48%',
      avgOperationsPerDay: '4'
    },
    miniIndice: {
      profitFactor: '1.45',
      sharpeRatio: '2.85',
      recoveryFactor: '7.20',
      avgDailyGain: 'R$ 520,80',
      maxDailyGain: 'R$ 2.100,00',
      avgDailyLoss: 'R$ 310,40',
      maxDailyLoss: 'R$ 680,00',
      dailyWinRate: '55%',
      avgOperationsPerDay: '6'
    },
    miniDolar: {
      profitFactor: '1.28',
      sharpeRatio: '2.40',
      recoveryFactor: '6.15',
      avgDailyGain: 'R$ 485,20',
      maxDailyGain: 'R$ 1.850,00',
      avgDailyLoss: 'R$ 320,15',
      maxDailyLoss: 'R$ 750,00',
      dailyWinRate: '50%',
      avgOperationsPerDay: '5'
    },
    portfolio: {
      profitFactor: '1.33',
      sharpeRatio: '2.61',
      recoveryFactor: '6.82',
      avgDailyGain: 'R$ 437,42',
      maxDailyGain: 'R$ 1.917,00',
      avgDailyLoss: 'R$ 287,32',
      maxDailyLoss: 'R$ 600,00',
      dailyWinRate: '52%',
      avgOperationsPerDay: '5'
    }
  };

  // Carregar estatísticas do localStorage ou usar padrões
  useEffect(() => {
    const savedStats = localStorage.getItem('assetStatistics');
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        setAssetStatistics({ ...defaultStatistics, ...parsed });
      } catch (error) {
        console.error('Error parsing saved statistics:', error);
        setAssetStatistics(defaultStatistics);
      }
    } else {
      setAssetStatistics(defaultStatistics);
    }
    setLoading(false);
  }, []);

  // Salvar estatísticas no localStorage
  const saveStatistics = (newStats: Record<string, any>) => {
    setAssetStatistics(newStats);
    localStorage.setItem('assetStatistics', JSON.stringify(newStats));
  };

  // Obter estatísticas do ativo atual
  const getCurrentAssetStats = () => {
    return assetStatistics[asset] || defaultStatistics[asset as keyof typeof defaultStatistics] || {};
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  const calculateMedian = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  };

  const getAssetValue = (result: MonthlyResult, selectedAsset: string): number | null => {
    switch (selectedAsset) {
      case 'bitcoin':
        return result.bitcoin;
      case 'miniIndice':
        return result.mini_indice;
      case 'miniDolar':
        return result.mini_dolar;
      case 'portfolio':
        return result.portfolio;
      default:
        return null;
    }
  };

  const handleEditField = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditValues({ ...editValues, [fieldKey]: currentValue });
  };

  const handleSaveField = async (fieldKey: string) => {
    try {
      setSaving(true);
      const newValue = editValues[fieldKey];
      
      if (!newValue || newValue.trim() === '') {
        setError('Valor não pode estar vazio.');
        return;
      }

      // Atualizar estatísticas do ativo atual
      const currentStats = getCurrentAssetStats();
      const updatedAssetStats = {
        ...currentStats,
        [fieldKey]: newValue
      };
      
      const newAssetStatistics = {
        ...assetStatistics,
        [asset]: updatedAssetStats
      };
      
      saveStatistics(newAssetStatistics);
      
      setEditingField(null);
      setError(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setError('Erro ao salvar valor');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({});
    setError(null);
  };

  // Função para determinar se um campo é editável (apenas valores inputados)
  const isFieldEditable = (fieldKey: string) => {
    const editableFields = [
      'profitFactor', 'sharpeRatio', 'recoveryFactor',
      'avgDailyGain', 'maxDailyGain', 'avgDailyLoss', 'maxDailyLoss',
      'dailyWinRate', 'avgOperationsPerDay'
    ];
    return editableFields.includes(fieldKey);
  };

  const renderEditableValue = (
    fieldKey: string, 
    value: string, 
    colorClass: string,
    prefix: string = '',
    suffix: string = '',
    isEditable: boolean = true
  ) => {
    if (isAdmin && isEditable && editingField === fieldKey) {
      return (
        <div className="flex items-center gap-2 justify-center">
          <input
            type="text"
            value={editValues[fieldKey] || ''}
            onChange={(e) => setEditValues({ ...editValues, [fieldKey]: e.target.value })}
            className="w-24 px-2 py-1 text-xs bg-slate-700 border border-slate-500 rounded text-white focus:border-blue-500 focus:outline-none text-center"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveField(fieldKey);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
          />
          <button
            onClick={() => handleSaveField(fieldKey)}
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

    return (
      <span 
        className={`${colorClass} ${isAdmin && isEditable ? 'cursor-pointer hover:opacity-80' : ''} group flex items-center justify-center`}
        onClick={() => isAdmin && isEditable && handleEditField(fieldKey, value)}
        title={isAdmin && isEditable ? "Clique para editar" : undefined}
      >
        {prefix}{value}{suffix}
        {isAdmin && isEditable && (
          <Edit3 className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    );
  };

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
  const currentAssetStats = getCurrentAssetStats();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 rounded-xl p-6 border border-slate-600/50">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 rounded-xl p-6 border border-slate-600/50">
      {/* Portfolio Title Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          Análise Detalhada - {(() => {
            switch (asset) {
              case 'bitcoin': return 'Portfólio Bitcoin';
              case 'miniIndice': return 'Portfólio Mini Índice';
              case 'miniDolar': return 'Portfólio Mini Dólar';
              case 'portfolio': return 'Portfólio Completo';
              default: return 'Portfólio';
            }
          })()}
        </h3>
        <p className="text-slate-300 text-sm">
          Estatísticas avançadas e métricas de performance para {selectedYear}
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Seção de Resumo */}
        <div className="bg-gradient-to-br from-slate-800/40 via-blue-900/30 to-teal-900/20 rounded-xl p-4 border border-slate-600/50">
          <h4 className="text-lg font-semibold text-white mb-3 text-center">Resumo da Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-center">
            <div>
              <span className="text-slate-400">Retorno Total:</span>
              {renderEditableValue(
                'totalReturn',
                `${metrics.totalReturn >= 0 ? '+' : ''}${formatNumber(metrics.totalReturn)}%`,
                `block font-semibold ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`,
                '',
                '',
                false
              )}
            </div>
            <div>
              <span className="text-slate-400">Meses Analisados:</span>
              {renderEditableValue(
                'monthsAnalyzed',
                data.filter(d => d.year === selectedYear && getAssetValue(d, asset) !== null).length.toString(),
                'block font-semibold text-blue-400',
                '',
                '',
                false
              )}
            </div>
            <div>
              <span className="text-slate-400">Payoff Mensal:</span>
              {renderEditableValue(
                'payoff',
                formatNumber(metrics.payoff),
                `block font-semibold ${metrics.payoff >= 1 ? 'text-green-400' : 'text-red-400'}`,
                '',
                '',
                false
              )}
            </div>
            <div>
              <span className="text-slate-400">Retorno Médio Mensal:</span>
              {renderEditableValue(
                'avgMonthlyReturn',
                `${formatNumber(metrics.totalReturn / Math.max(data.filter(d => d.year === selectedYear && getAssetValue(d, asset) !== null).length, 1))}%`,
                `block font-semibold ${(metrics.totalReturn / Math.max(data.filter(d => d.year === selectedYear && getAssetValue(d, asset) !== null).length, 1)) >= 0 ? 'text-green-400' : 'text-red-400'}`,
                '',
                '',
                false
              )}
            </div>
            <div>
              <span className="text-slate-400">Fator de Lucro:</span>
              {renderEditableValue(
                'profitFactor',
                currentAssetStats.profitFactor || '1.33',
                `block font-semibold text-green-400`,
                '',
                '',
                isFieldEditable('profitFactor')
              )}
            </div>
            <div>
              <span className="text-slate-400">Sharpe Ratio:</span>
              {renderEditableValue(
                'sharpeRatio',
                currentAssetStats.sharpeRatio || '2.61',
                `block font-semibold text-green-400`,
                '',
                '',
                isFieldEditable('sharpeRatio')
              )}
            </div>
            <div>
              <span className="text-slate-400">Fator de Recuperação:</span>
              {renderEditableValue(
                'recoveryFactor',
                currentAssetStats.recoveryFactor || '6.82',
                `block font-semibold text-green-400`,
                '',
                '',
                isFieldEditable('recoveryFactor')
              )}
            </div>
          </div>
        </div>

        {/* Análises Detalhadas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Análise de Ganhos */}
          <div className="bg-gradient-to-br from-green-900/20 via-slate-800/40 to-blue-900/20 rounded-xl p-3 border border-green-500/20">
            <h5 className="text-green-400 font-semibold mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Análise de Ganhos Mensais
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Meses Positivos:</span>
                {renderEditableValue(
                  'positiveMonths',
                  (() => {
                    const filteredData = data.filter(d => d.year === selectedYear);
                    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                    return values.filter(v => v > 0).length.toString();
                  })(),
                  'text-green-400 font-medium',
                  '',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ganho Médio:</span>
                {renderEditableValue(
                  'avgWin',
                  `${formatNumber(metrics.avgWin)}%`,
                  'text-green-400 font-medium',
                  '+',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ganho Mediano:</span>
                {renderEditableValue(
                  'medianWin',
                  `${(() => {
                    const filteredData = data.filter(d => d.year === selectedYear);
                    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                    const positiveValues = values.filter(v => v > 0);
                    return formatNumber(calculateMedian(positiveValues));
                  })()}%`,
                  'text-green-400 font-medium',
                  '+',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maior Ganho:</span>
                {renderEditableValue(
                  'maxWin',
                  `${(() => {
                    const filteredData = data.filter(d => d.year === selectedYear);
                    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                    const positiveValues = values.filter(v => v > 0);
                    return positiveValues.length > 0 ? formatNumber(Math.max(...positiveValues)) : '0.00';
                  })()}%`,
                  'text-green-400 font-medium',
                  '+',
                  '',
                  false
                )}
              </div>
            </div>
          </div>

          {/* Análise de Perdas */}
          <div className="bg-gradient-to-br from-red-900/20 via-slate-800/40 to-blue-900/20 rounded-xl p-3 border border-red-500/20">
            <h5 className="text-red-400 font-semibold mb-2 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              Análise de Perdas Mensais
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Meses Negativos:</span>
                {renderEditableValue(
                  'negativeMonths',
                  (() => {
                    const filteredData = data.filter(d => d.year === selectedYear);
                    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                    return values.filter(v => v < 0).length.toString();
                  })(),
                  'text-red-400 font-medium',
                  '',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perda Média:</span>
                {renderEditableValue(
                  'avgLoss',
                  `${formatNumber(metrics.avgLoss)}%`,
                  'text-red-400 font-medium',
                  '-',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perda Mediana:</span>
                {renderEditableValue(
                  'medianLoss',
                  `${(() => {
                    const filteredData = data.filter(d => d.year === selectedYear);
                    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                    const negativeValues = values.filter(v => v < 0).map(v => Math.abs(v));
                    return formatNumber(calculateMedian(negativeValues));
                  })()}%`,
                  'text-red-400 font-medium',
                  '-',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Maior Perda:</span>
                {renderEditableValue(
                  'maxLoss',
                  `${(() => {
                    const filteredData = data.filter(d => d.year === selectedYear);
                    const values = filteredData.map(d => getAssetValue(d, asset)).filter((v): v is number => v !== null);
                    const negativeValues = values.filter(v => v < 0);
                    return negativeValues.length > 0 ? formatNumber(Math.min(...negativeValues)) : '0.00';
                  })()}%`,
                  'text-red-400 font-medium',
                  '',
                  '',
                  false
                )}
              </div>
            </div>
          </div>

          {/* Métricas de Consistência */}
          <div className="bg-gradient-to-br from-blue-900/20 via-slate-800/40 to-cyan-900/20 rounded-xl p-3 border border-blue-500/20">
            <h5 className="text-blue-400 font-semibold mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Consistência Mensal
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Taxa de Acerto Mensal:</span>
                {renderEditableValue(
                  'winRate',
                  `${formatNumber(metrics.winRate)}%`,
                  `font-medium ${metrics.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`,
                  '',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fator de Lucro Mensal:</span>
                {renderEditableValue(
                  'monthlyProfitFactor',
                  formatNumber(metrics.profitFactor),
                  `font-medium ${metrics.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`,
                  '',
                  '',
                  false
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Meses Positivos Consecutivos:</span>
                {renderEditableValue(
                  'consecutiveWins',
                  `${(() => {
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
                  })()} meses`,
                  'text-blue-400 font-medium',
                  '',
                  '',
                  false
                )}
              </div>
            </div>
          </div>

          {/* Métricas Diárias */}
          <div className="bg-gradient-to-br from-purple-900/20 via-slate-800/40 to-teal-900/20 rounded-xl p-3 border border-purple-500/20">
            <h5 className="text-purple-400 font-semibold mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance Diária
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ganho Médio Diário:</span>
                {renderEditableValue(
                  'avgDailyGain',
                  currentAssetStats.avgDailyGain || 'R$ 437,42',
                  'text-green-400 font-medium',
                  '',
                  '',
                  isFieldEditable('avgDailyGain')
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ganho Máximo Diário:</span>
                {renderEditableValue(
                  'maxDailyGain',
                  currentAssetStats.maxDailyGain || 'R$ 1.917,00',
                  'text-green-400 font-medium',
                  '',
                  '',
                  isFieldEditable('maxDailyGain')
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perda Média Diária:</span>
                {renderEditableValue(
                  'avgDailyLoss',
                  currentAssetStats.avgDailyLoss || 'R$ 287,32',
                  'text-red-400 font-medium',
                  '',
                  '',
                  isFieldEditable('avgDailyLoss')
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Perda Máxima Diária:</span>
                {renderEditableValue(
                  'maxDailyLoss',
                  currentAssetStats.maxDailyLoss || 'R$ 600,00',
                  'text-red-400 font-medium',
                  '',
                  '',
                  isFieldEditable('maxDailyLoss')
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxa de Acerto Diária:</span>
                {renderEditableValue(
                  'dailyWinRate',
                  currentAssetStats.dailyWinRate || '52%',
                  `font-medium text-green-400`,
                  '',
                  '',
                  isFieldEditable('dailyWinRate')
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Média Operações/Dia:</span>
                {renderEditableValue(
                  'avgOperationsPerDay',
                  currentAssetStats.avgOperationsPerDay || '5',
                  'text-blue-400 font-medium',
                  '',
                  '',
                  isFieldEditable('avgOperationsPerDay')
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mensagem de erro */}
        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedStatistics;