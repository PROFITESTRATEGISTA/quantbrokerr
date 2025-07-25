import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Filter, MessageCircle, Plus, AlertCircle, Edit3, Save, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ResultsChart from './ResultsChart';
import AdminEditButton from './AdminEditButton';
import AdvancedStatistics from './AdvancedStatistics';
import ResultTypeTag from './ResultTypeTag';

interface MonthData {
  id?: string;
  month: string;
  year: number;
  bitcoin: number | null;
  miniIndice: number | null;
  miniDolar: number | null;
  portfolio: number | null;
  resultType: 'backtest' | 'live';
}

interface PerformanceMetrics {
  profitFactor: number;
  payoff: number;
  drawdown: number;
  winRate: number;
}

const ResultsCalendar: React.FC = () => {
  // Define months array
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const [chartAsset, setChartAsset] = useState<'bitcoin' | 'miniIndice' | 'miniDolar' | 'portfolio'>('portfolio');
  const [calendarAsset, setCalendarAsset] = useState<'bitcoin' | 'miniIndice' | 'miniDolar' | 'portfolio'>('portfolio');
  const [isAdmin, setIsAdmin] = useState(false);
  const [chartYear, setChartYear] = useState<number>(2024);
  const [calendarYear, setCalendarYear] = useState<number>(2024);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([2024]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editResultType, setEditResultType] = useState<'backtest' | 'live'>('live');
  const [selectedAsset, setSelectedAsset] = useState<string>('portfolio');

  // Helper functions
  const getAssetDisplayName = (asset: string) => {
    switch (asset) {
      case 'bitcoin': return 'Bitcoin';
      case 'miniIndice': return 'Mini Índice';
      case 'miniDolar': return 'Mini Dólar';
      case 'portfolio': return 'Portfólio Completo';
      default: return asset;
    }
  };

  const getAssetValue = (monthData: MonthData, asset: string) => {
    switch (asset) {
      case 'bitcoin': return monthData.bitcoin;
      case 'miniIndice': return monthData.miniIndice;
      case 'miniDolar': return monthData.miniDolar;
      case 'portfolio': return monthData.portfolio;
      default: return null;
    }
  };

  // Data filtering
  const chartData = monthlyData.filter(d => d.year === chartYear);
  const calendarData = monthlyData.filter(d => d.year === calendarYear);

  // Calculate metrics
  const calculateMetrics = (data: MonthData[], asset: string) => {
    const values = data
      .map(d => getAssetValue(d, asset))
      .filter((v): v is number => v !== null);

    if (values.length === 0) {
      return {
        totalReturn: 0,
        winRate: 0,
        bestMonth: 0,
        worstMonth: 0
      };
    }

    const totalReturn = values.reduce((acc, val) => acc + val, 0);
    const positiveMonths = values.filter(v => v > 0).length;
    const winRate = (positiveMonths / values.length) * 100;
    const bestMonth = Math.max(...values);
    const worstMonth = Math.min(...values);

    return {
      totalReturn,
      winRate,
      bestMonth,
      worstMonth
    };
  };

  const metrics = calculateMetrics(calendarData, calendarAsset);

  // Admin functions
  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'pedropardal04@gmail.com');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monthly_results')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: true });

      if (error) throw error;

      const formattedData: MonthData[] = data.map(item => ({
        id: item.id,
        month: item.month,
        year: item.year,
        bitcoin: item.bitcoin,
        miniIndice: item.mini_indice,
        miniDolar: item.mini_dolar,
        portfolio: item.portfolio,
        resultType: item.result_type || 'live'
      }));

      setMonthlyData(formattedData);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonth = async (monthData: Omit<MonthData, 'id'>) => {
    try {
      const { error } = await supabase
        .from('monthly_results')
        .insert({
          month: monthData.month,
          year: monthData.year,
          bitcoin: monthData.bitcoin,
          mini_indice: monthData.miniIndice,
          mini_dolar: monthData.miniDolar,
          portfolio: monthData.portfolio,
          result_type: monthData.resultType
        });

      if (error) throw error;

      await fetchResults();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding month:', error);
      setError('Erro ao adicionar mês');
    }
  };

  const handleUpdateMonth = async (month: string, year: number, asset: string, value: number | null) => {
    try {
      const columnMap: { [key: string]: string } = {
        bitcoin: 'bitcoin',
        miniIndice: 'mini_indice',
        miniDolar: 'mini_dolar',
        portfolio: 'portfolio'
      };

      const { error } = await supabase
        .from('monthly_results')
        .update({ [columnMap[asset]]: value })
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;

      await fetchResults();
    } catch (error) {
      console.error('Error updating month:', error);
      setError('Erro ao atualizar dados');
    }
  };

  const handleUpdateResultType = async (month: string, year: number, resultType: 'backtest' | 'live') => {
    try {
      const { error } = await supabase
        .from('monthly_results')
        .update({ result_type: resultType })
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;

      await fetchResults();
    } catch (error) {
      console.error('Error updating result type:', error);
      setError('Erro ao atualizar tipo de resultado');
    }
  };

  const handleDeleteResult = async (month: string, year: number, asset: string) => {
    try {
      setError(null);
      
      // Definir qual coluna será zerada
      const columnMap: { [key: string]: string } = {
        bitcoin: 'bitcoin',
        miniIndice: 'mini_indice',
        miniDolar: 'mini_dolar',
        portfolio: 'portfolio'
      };

      const { error } = await supabase
        .from('monthly_results')
        .update({ [columnMap[asset]]: null })
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;

      await fetchResults();
      setEditingMonth(null);
      setEditValue('');
      setEditResultType('live');
    } catch (error) {
      console.error('Error deleting result:', error);
      setError('Erro ao excluir resultado');
    }
  };

  const handleUpdateStatistics = async (asset: string, year: number, metrics: any) => {
    try {
      // Here you could save custom statistics to a separate table if needed
      // For now, we'll just show a success message
      console.log('Updating statistics for', asset, year, metrics);
      // You could implement a custom statistics table in Supabase here
    } catch (error) {
      console.error('Error updating statistics:', error);
      setError('Erro ao atualizar estatísticas');
    }
  };

  const handleQuickEdit = async (month: string, year: number) => {
    try {
      setError(null);
      
      // Se não há dados para este mês, criar novo registro
      const existingMonth = calendarData.find(d => d.month === month);
      
      if (!existingMonth) {
        // Criar novo mês com todos os valores zerados exceto o ativo selecionado
        const newMonthData = {
          month: month,
          year: year,
          bitcoin: calendarAsset === 'bitcoin' ? (editValue === '' ? null : parseFloat(editValue)) : null,
          miniIndice: calendarAsset === 'miniIndice' ? (editValue === '' ? null : parseFloat(editValue)) : null,
          miniDolar: calendarAsset === 'miniDolar' ? (editValue === '' ? null : parseFloat(editValue)) : null,
          portfolio: calendarAsset === 'portfolio' ? (editValue === '' ? null : parseFloat(editValue)) : null,
          resultType: editResultType
        };
        
        await handleAddMonth(newMonthData);
      } else {
        // Atualizar valor existente
        const newValue = editValue === '' ? null : parseFloat(editValue);
        
        if (editValue !== '' && (isNaN(newValue!) || !isFinite(newValue!))) {
          setError('Valor inválido. Use números decimais (ex: 12.5)');
          return;
        }

        await handleUpdateMonth(month, year, calendarAsset, newValue);
        
        // Atualizar tipo de resultado se mudou
        if (existingMonth.resultType !== editResultType) {
          await handleUpdateResultType(month, year, editResultType);
        }
      }
      
      setEditingMonth(null);
      setEditValue('');
      setEditResultType('live');
    } catch (error) {
      console.error('Erro ao editar valor:', error);
      setError('Erro ao salvar alteração');
    }
  };

  // Effects
  useEffect(() => {
    checkAdminStatus();
    fetchResults();
  }, []);

  // Show empty state message for production
  const isProductionMode = monthlyData.length === 0;
  // Update available years when data changes
  useEffect(() => {
    if (monthlyData.length > 0) {
      const years = [...new Set(monthlyData.map(d => d.year))].sort((a, b) => b - a);
      setAvailableYears(years);
      
      // Set initial years to most recent available year
      const mostRecentYear = years[0];
      if (mostRecentYear) {
        setChartYear(mostRecentYear);
        setCalendarYear(mostRecentYear);
      }
    }
  }, [monthlyData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Chart Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Gráfico de Performance
            </h2>
            
            {/* Chart Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <select
                  value={chartYear}
                  onChange={(e) => setChartYear(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <select
                  value={chartAsset}
                  onChange={(e) => setChartAsset(e.target.value as any)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="bitcoin">Bitcoin</option>
                  <option value="miniIndice">Mini Índice</option>
                  <option value="miniDolar">Mini Dólar</option>
                  <option value="portfolio">Portfólio Completo</option>
                </select>
              </div>
            </div>
          </div>
          
          <ResultsChart 
            data={monthlyData} 
            asset={chartAsset}
            year={chartYear}
          />
        </div>

        {/* Advanced Statistics Section */}
        <AdvancedStatistics 
          data={monthlyData}
          asset={chartAsset}
          availableYears={availableYears}
          isAdmin={isAdmin}
        />

        {/* Calendar Section */}
        <div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Calendário de Resultados {calendarYear} - {getAssetDisplayName(calendarAsset)}
            </h2>
            
            {/* Calendar Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <select
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <select
                  value={calendarAsset}
                  onChange={(e) => setCalendarAsset(e.target.value as any)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="bitcoin">Bitcoin</option>
                  <option value="miniIndice">Mini Índice</option>
                  <option value="miniDolar">Mini Dólar</option>
                  <option value="portfolio">Portfólio Completo</option>
                </select>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Mês
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          ) : isProductionMode ? (
            <div className="text-center py-12">
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-600">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Sistema em Modo de Produção
                </h3>
                <p className="text-slate-300 mb-6">
                  Os dados foram zerados para início da operação real. 
                  {isAdmin ? ' Use o botão "Adicionar Mês" para inserir os primeiros resultados.' : ' Os resultados aparecerão aqui conforme forem sendo inseridos.'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar Primeiro Resultado
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {months.map((month) => {
                  const monthData = calendarData.find(d => d.month === month);
                  const value = monthData ? getAssetValue(monthData, calendarAsset) : null;
                  const hasData = value !== null;
                  const isBacktest = monthData?.resultType === 'backtest';
                  
                  return (
                    <div
                      key={month}
                      className={`relative p-6 rounded-xl border transition-all duration-200 ${
                        hasData && isAdmin ? 'hover:scale-105 cursor-pointer' : hasData ? 'hover:scale-105' : ''
                      } ${
                        value === null
                          ? 'bg-slate-800/50 border-slate-600'
                          : value >= 0
                          ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/30'
                          : 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/30'
                      }`}
                      onClick={() => {
                        if (isAdmin && editingMonth !== `${month}-${calendarYear}`) {
                          setEditingMonth(`${month}-${calendarYear}`);
                          setEditValue(value?.toString() || '');
                          setEditResultType(monthData?.resultType || 'live');
                        }
                      }}
                    >
                      {/* Tag de tipo de resultado */}
                      {hasData && (
                        <div className="absolute top-2 left-2 group/tag">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer transition-all hover:scale-105 ${
                            isBacktest 
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}
                            onClick={(e) => {
                              if (isAdmin) {
                                e.stopPropagation();
                                setEditingMonth(`${month}-${calendarYear}`);
                                setEditValue(value?.toString() || '');
                                setEditResultType(monthData?.resultType || 'live');
                              }
                            }}
                            title={isAdmin ? "Clique para editar tipo de resultado" : undefined}
                          >
                            {isBacktest ? 'Backtest' : 'Ao Vivo'}
                            {isAdmin && (
                              <span className="ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                                ✏️
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Botões de ação para admin */}
                      {isAdmin && editingMonth !== `${month}-${calendarYear}` && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {hasData ? (
                            /* Botão de edição para valores existentes */
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMonth(`${month}-${calendarYear}`);
                                setEditValue(value?.toString() || '');
                                setEditResultType(monthData?.resultType || 'live');
                              }}
                              className="p-1 bg-slate-700/80 hover:bg-slate-600 rounded-full transition-colors"
                              title="Editar valor"
                            >
                              <Edit3 className="h-3 w-3 text-slate-300" />
                            </button>
                          ) : (
                            /* Botão de adicionar para meses sem dados */
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMonth(`${month}-${calendarYear}`);
                                setEditValue('');
                                setEditResultType('live');
                              }}
                              className="p-1.5 bg-green-600/80 hover:bg-green-500 rounded-full transition-colors shadow-lg"
                              title="Adicionar valor"
                            >
                              <Plus className="h-4 w-4 text-white" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-1">{month}</h3>
                        <p className="text-sm text-gray-400 mb-3">{calendarYear}</p>
                        
                        {editingMonth === `${month}-${calendarYear}` ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Tipo de Resultado</label>
                              <select
                                value={editResultType}
                                onChange={(e) => setEditResultType(e.target.value as 'backtest' | 'live')}
                                className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-500 rounded text-white focus:border-blue-500 focus:outline-none"
                              >
                                <option value="live">Mercado ao Vivo</option>
                                <option value="backtest">Backtest</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Valor (%)</label>
                              <input
                              type="number"
                              step="0.1"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              placeholder={hasData ? value?.toString() : "0.0"}
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleQuickEdit(month, calendarYear);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingMonth(null);
                                  setEditValue('');
                                  setEditResultType('live');
                                  setError(null);
                                }
                              }}
                            />
                            </div>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleQuickEdit(month, calendarYear)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium flex items-center"
                                title="Salvar"
                              >
                                {hasData ? 'Atualizar' : 'Adicionar'}
                              </button>
                              {hasData && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Tem certeza que deseja excluir o resultado de ${month} ${calendarYear} para ${getAssetDisplayName(calendarAsset)}?`)) {
                                      handleDeleteResult(month, calendarYear, calendarAsset);
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                                  title="Excluir resultado"
                                >
                                  Excluir
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingMonth(null);
                                  setEditValue('');
                                  setEditResultType('live');
                                  setError(null);
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                                title="Cancelar"
                              >
                                Cancelar
                              </button>
                            </div>
                            {error && (
                              <div className="text-red-400 text-xs text-center mt-2">
                                {error}
                              </div>
                            )}
                          </div>
                        ) : hasData ? (
                          <>
                            <div className="group">
                            <div className={`text-2xl font-bold transition-colors ${
                              value >= 0 ? 'text-green-400' : 'text-red-400'
                            } ${isAdmin ? 'group-hover:text-blue-400' : ''}`}>
                              {value >= 0 ? '+' : ''}{value.toFixed(1)}%
                            </div>
                            {isAdmin && (
                              <div className="text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Clique para editar
                              </div>
                            )}
                          </div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-500 text-lg group">
                            <div>Sem dados</div>
                            {isAdmin && (
                              <div className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Clique no + para adicionar
                              </div>
                            )}
                          </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">Total Acumulado</span>
                  </div>
                  <div className={`text-2xl font-bold ${
                    metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-400">Taxa de Acerto</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {metrics.winRate.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-gray-400">Melhor Mês</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    +{metrics.bestMonth.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-gray-400">Pior Mês</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {metrics.worstMonth.toFixed(1)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add Month Modal */}
        {showAddForm && isAdmin && (
          <AddMonthModal
            onAdd={handleAddMonth}
            onClose={() => setShowAddForm(false)}
            months={months}
            availableYears={availableYears}
          />
        )}
      </div>
    </div>
  );
};

// Add Month Modal Component
interface AddMonthModalProps {
  onAdd: (monthData: Omit<MonthData, 'id'>) => void;
  onClose: () => void;
  months: string[];
  availableYears: number[];
}

const AddMonthModal: React.FC<AddMonthModalProps> = ({ onAdd, onClose, months, availableYears }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [resultType, setResultType] = useState<'backtest' | 'live'>('live');
  const [bitcoin, setBitcoin] = useState('');
  const [miniIndice, setMiniIndice] = useState('');
  const [miniDolar, setMiniDolar] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMonth) {
      alert('Por favor, selecione um mês');
      return;
    }

    onAdd({
      month: selectedMonth,
      year: selectedYear,
      resultType: resultType,
      bitcoin: bitcoin ? parseFloat(bitcoin) : null,
      miniIndice: miniIndice ? parseFloat(miniIndice) : null,
      miniDolar: miniDolar ? parseFloat(miniDolar) : null,
      portfolio: portfolio ? parseFloat(portfolio) : null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Adicionar Novo Mês</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
              required
            >
              <option value="">Selecione um mês</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ano</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Resultado</label>
            <select
              value={resultType}
              onChange={(e) => setResultType(e.target.value as 'backtest' | 'live')}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
            >
              <option value="live">Mercado ao Vivo</option>
              <option value="backtest">Backtest</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {resultType === 'live' ? 'Resultado de operações reais' : 'Resultado de teste histórico'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bitcoin (%)</label>
              <input
                type="number"
                step="0.1"
                value={bitcoin}
                onChange={(e) => setBitcoin(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mini Índice (%)</label>
              <input
                type="number"
                step="0.1"
                value={miniIndice}
                onChange={(e) => setMiniIndice(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mini Dólar (%)</label>
              <input
                type="number"
                step="0.1"
                value={miniDolar}
                onChange={(e) => setMiniDolar(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Portfólio (%)</label>
              <input
                type="number"
                step="0.1"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResultsCalendar;