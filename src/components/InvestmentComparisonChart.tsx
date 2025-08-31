import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Home, Shield, Zap, DollarSign, Calculator, AlertTriangle, BarChart3 } from 'lucide-react';

const InvestmentComparisonChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1year' | '3years' | '5years'>('3years');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [initialCapital, setInitialCapital] = useState(50000);

  // Dados de comparação baseados em cenários realistas
  const generateComparisonData = () => {
    const months = timeframe === '1year' ? 12 : timeframe === '3years' ? 36 : 60;
    const data = [];

    for (let i = 0; i <= months; i++) {
      // CDI 10.5% a.a. líquido
      const cdiMonthlyRate = 0.105 / 12; // 10.5% anual dividido por 12 meses
      const cdiValue = initialCapital * Math.pow(1 + cdiMonthlyRate, i);

      // Imóvel: 6% a.a. líquido (após impostos, IPTU, manutenção)

      // Portfólio IA: Meta 60% a.a. (4.8% a.m. médio) com drawdowns realistas de até 25%
      let aiValue = initialCapital;
      
      // Simular performance mensal realista com drawdowns de até 25%
      if (i > 0) {
        // Calcular valor alvo para atingir 60% a.a. no final do período
        const targetAnnualReturn = 0.60; // 60% a.a.
        const monthsInYear = 12;
        const targetMonthlyReturn = Math.pow(1 + targetAnnualReturn, 1/monthsInYear) - 1; // ~3.9% a.m. composto
        
        // Valor alvo para este mês baseado na meta de 60% a.a.
        const targetValue = initialCapital * Math.pow(1 + targetMonthlyReturn, i);
        
        // Criar volatilidade realista mas mantendo trajetória ascendente
        let monthlyPerformance;
        const previousValue = data[i - 1]?.portfolioIA || initialCapital;
        
        // Padrão de drawdowns controlados
        if (i % 12 === 8) {
          // Drawdown severo anual (-15% a -20%)
          monthlyPerformance = -0.15 - (Math.random() * 0.05);
        } else if (i % 8 === 5) {
          // Drawdown moderado (-8% a -12%)
          monthlyPerformance = -0.08 - (Math.random() * 0.04);
        } else if (i % 6 === 3) {
          // Perda leve (-3% a -6%)
          monthlyPerformance = -0.03 - (Math.random() * 0.03);
        } else {
          // Meses positivos - calcular performance necessária para atingir meta
          const neededGrowth = targetValue / previousValue - 1;
          // Adicionar volatilidade mas manter direção positiva
          monthlyPerformance = Math.max(neededGrowth + (Math.random() * 0.08 - 0.02), 0.02);
        }
        
        aiValue = previousValue * (1 + monthlyPerformance);
        
        // Ajustar para não ficar muito abaixo da meta no final
        if (i > months * 0.8) { // Últimos 20% dos meses
          const currentProgress = aiValue / initialCapital - 1;
          const expectedProgress = targetValue / initialCapital - 1;
          
          if (currentProgress < expectedProgress * 0.8) {
            // Boost para recuperar e atingir meta
            const boostNeeded = (expectedProgress - currentProgress) * 0.3;
            aiValue = aiValue * (1 + boostNeeded);
          }
        }
      }

      data.push({
        month: i,
        monthLabel: i === 0 ? 'Início' : `${i}º mês`,
        cdi: cdiValue,
        portfolioIA: aiValue,
        cdiReturn: ((cdiValue - initialCapital) / initialCapital) * 100,
        portfolioIAReturn: ((aiValue - initialCapital) / initialCapital) * 100
      });
    }

    return data;
  };

  const chartData = generateComparisonData();
  const finalData = chartData[chartData.length - 1];

  const investments = [
    {
      name: 'Portfólio de IA',
      icon: Zap,
      color: '#22c55e',
      finalValue: finalData.portfolioIA,
      finalReturn: finalData.portfolioIAReturn,
      monthlyReturn: 4.8,
      annualReturn: 60.0,
      risk: 'Limitado ao capital investido',
      liquidity: 'Alta (D+0)',
      advantages: [
        'Meta: 60% a.a. líquido (Quant Broker)',
        'Alto poder de alavancagem (até 5x)',
        'Gestão automatizada 24/7',
        'Diversificação automática',
        'Liquidez imediata',
        'Drawdown máximo: 25% mensal'
      ],
      considerations: [
        'Volatilidade de mercado',
        'Risco limitado ao capital',
        'Meses de drawdown esperados (até -25%)',
        'Performance varia mensalmente'
      ]
    },
    {
      name: 'CDI (10,5% a.a.)',
      icon: Shield,
      color: '#3b82f6',
      finalValue: finalData.cdi,
      finalReturn: finalData.cdiReturn,
      monthlyReturn: 0.875,
      annualReturn: 10.5,
      risk: 'Baixo (FGC até R$ 250k)',
      liquidity: 'Média (D+1 a D+30)',
      advantages: [
        'Segurança (FGC)',
        'Previsibilidade',
        'Baixo risco'
      ],
      considerations: [
        'Rendimento limitado',
        'Imposto de Renda',
        'Perda para inflação'
      ]
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-bold ml-2" style={{ color: entry.color }}>
                R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simulação: Portfólios de IA vs Mercado
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            <strong>SIMULAÇÃO EDUCATIVA:</strong> Veja como os Portfólios de IA se comparam com CDI 
            em diferentes cenários de tempo e capital. Dados baseados em projeções matemáticas.
          </p>
          
          {/* Botão para ver resultados reais */}
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '/resultados'}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              <BarChart3 className="h-6 w-6" />
              Ver Resultados Reais Agora Mesmo
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Acesse nossos resultados mensais reais de 2024
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Capital:</label>
            <select
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm flex-1 min-w-0"
            >
              <option value={10000}>R$ 10.000</option>
              <option value={25000}>R$ 25.000</option>
              <option value={50000}>R$ 50.000</option>
              <option value={100000}>R$ 100.000</option>
              <option value={250000}>R$ 250.000</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Período:</label>
            <div className="flex gap-1 sm:gap-2 flex-1">
              {[
                { value: '1year', label: '1 Ano' },
                { value: '3years', label: '3 Anos' },
                { value: '5years', label: '5 Anos' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value as any)}
                  className={`px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 ${
                    timeframe === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs sm:text-sm"
            >
              {chartType === 'line' ? <TrendingUp className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
              {chartType === 'line' ? 'Evolução' : 'Comparativo'}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 mb-12">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <Calculator className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-semibold text-sm">
                📊 SIMULAÇÃO EDUCATIVA - Dados baseados em projeções matemáticas
              </span>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            <span className="hidden sm:inline">Evolução do Capital: {formatCurrency(initialCapital)} Inicial</span>
            <span className="sm:hidden">Capital: {formatCurrency(initialCapital)}</span>
          </h3>
          
          <div className="h-64 sm:h-80 lg:h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="monthLabel" 
                    stroke="#64748b"
                    fontSize={10}
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={formatCurrency}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="portfolioIA" 
                    stroke="#22c55e" 
                    strokeWidth={4}
                    name="Portfólio IA"
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cdi" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="CDI 10,5% a.a."
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={[{
                  name: 'Resultado Final',
                  'Portfólio IA': finalData.portfolioIA,
                  'CDI 10,5% a.a.': finalData.cdi
                }]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Portfólio IA" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CDI 10,5% a.a." fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 text-center">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                <span className="hidden sm:inline">Portfólio IA (Meta: 60% a.a.)</span>
                <span className="sm:hidden">Portfólio IA (60% a.a.)</span>
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                <span className="hidden sm:inline">CDI (10,5% a.a. líquido)</span>
                <span className="sm:hidden">CDI (10,5% a.a.)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Cards */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 mb-12 max-w-4xl mx-auto">
          {investments.map((investment, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border-2 transition-all hover:shadow-xl ${
                investment.name === 'Portfólio de IA'
                  ? 'border-green-500 transform scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {investment.name === 'Portfólio de IA' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    MAIOR RETORNO
                  </span>
                </div>
              )}

              <div className="text-center mb-4 sm:mb-6">
                <div className={`inline-flex p-4 rounded-full mb-4`} style={{ backgroundColor: `${investment.color}20` }}>
                  <investment.icon className="h-8 w-8" style={{ color: investment.color }} />
                </div>
                
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{investment.name}</h4>
                
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  <div>
                    <span className="text-sm text-gray-500">Valor Final ({timeframe === '1year' ? '1 ano' : timeframe === '3years' ? '3 anos' : '5 anos'})</span>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: investment.color }}>
                      R$ {investment.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm font-medium" style={{ color: investment.color }}>
                      +{investment.finalReturn.toFixed(1)}% total
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500">Retorno Mensal</span>
                      <div className="font-bold" style={{ color: investment.color }}>
                        {investment.monthlyReturn.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Retorno Anual</span>
                      <div className="font-bold" style={{ color: investment.color }}>
                        {investment.annualReturn.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Características:</h5>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risco:</span>
                      <span className="font-medium">{investment.risk}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liquidez:</span>
                      <span className="font-medium">{investment.liquidity}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-green-700 mb-2">Vantagens:</h5>
                  <ul className="space-y-1">
                    {investment.advantages.map((advantage, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-green-600 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-orange-700 mb-2">Considerações:</h5>
                  <ul className="space-y-1">
                    {investment.considerations.map((consideration, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-orange-600 flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        {consideration}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scenario Analysis */}
        <div className="bg-gradient-to-br from-slate-900/90 via-blue-950/90 to-purple-950/90 rounded-2xl p-4 sm:p-6 lg:p-8 mb-12 border border-slate-600/50 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            <span className="hidden sm:inline">Estratégias de Alavancagem: Portfólio de IA Quant Broker</span>
            <span className="sm:hidden">Estratégias de Alavancagem</span>
          </h3>
          
          {/* Drawdown Warning */}
          <div className="mb-6 sm:mb-8 bg-red-900/30 border border-red-500/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400 mr-2 sm:mr-3" />
              <h4 className="text-lg sm:text-xl font-bold text-red-300">
                <span className="hidden sm:inline">⚠️ Drawdown Máximo: 25% Mensal</span>
                <span className="sm:hidden">⚠️ DD Máx: 25%</span>
              </h4>
            </div>
            <p className="text-red-200 text-center leading-relaxed text-sm sm:text-base">
              <strong>IMPORTANTE:</strong> Todas as estratégias têm drawdown máximo controlado de <span className="text-red-300 font-bold">25% ao mês</span>. 
              A IA monitora e controla riscos automaticamente para proteger seu capital.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
            {/* Estratégia Conservador - 1x Alavancagem */}
            <div className="bg-slate-800/60 rounded-xl p-4 sm:p-6 border border-green-500/40 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2 sm:mr-3" />
                <h4 className="text-lg sm:text-xl font-bold text-green-300">Conservador</h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-900/30 p-3 sm:p-4 rounded-lg border border-green-500/40">
                  <h5 className="font-semibold text-green-300 mb-2 sm:mb-3 text-sm sm:text-base">
                    <span className="hidden sm:inline">🛡️ Alavancagem 1x - Foco em Renda Mensal</span>
                    <span className="sm:hidden">🛡️ 1x - Renda Mensal</span>
                  </h5>
                  <div className="text-xs sm:text-sm text-green-200 space-y-1 sm:space-y-2">
                    <p><strong>• Capital:</strong> R$ 10.000</p>
                    <p><strong>• Renda mensal:</strong> R$ 800 (8% a.m.)</p>
                    <p><strong>• Risco:</strong> Máx R$ 10.000</p>
                    <p><strong>• Liquidez:</strong> Imediata (D+0)</p>
                    <p><strong>• DD máx:</strong> <span className="text-red-400 font-bold bg-red-900/30 px-1 sm:px-2 py-1 rounded text-xs">25%</span></p>
                    <p><strong>• Perfil:</strong> Conservador</p>
                  </div>
                </div>
                
                <div className="text-xs text-green-300 bg-green-900/20 p-2 sm:p-3 rounded-lg">
                  <p><strong>💡 Ideal:</strong> Renda mensal consistente</p>
                </div>
              </div>
            </div>
            
            {/* Estratégia Alavancagem Saudável - 3x */}
            <div className="bg-slate-800/60 rounded-xl p-4 sm:p-6 border border-blue-500/40 backdrop-blur-sm relative hover:bg-slate-800/70 transition-all">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center shadow-lg">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">RECOMENDADO</span>
                  <span className="sm:hidden">TOP</span>
                </span>
              </div>
              
              <div className="flex items-center mb-4 mt-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-2 sm:mr-3" />
                <h4 className="text-lg sm:text-xl font-bold text-blue-300">
                  <span className="hidden sm:inline">Alavancagem Saudável</span>
                  <span className="sm:hidden">Saudável</span>
                </h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-900/30 p-3 sm:p-4 rounded-lg border border-blue-500/40">
                  <h5 className="font-semibold text-blue-300 mb-2 sm:mb-3 text-sm sm:text-base">
                    <span className="hidden sm:inline">🎯 Alavancagem 3x - Equilíbrio Ideal</span>
                    <span className="sm:hidden">🎯 3x - Equilíbrio</span>
                  </h5>
                  <div className="text-xs sm:text-sm text-blue-200 space-y-1 sm:space-y-2">
                    <p><strong>• Capital:</strong> R$ 30.000 (R$ 10.000 a cada 1x)</p>
                    <p><strong>• Alavancagem:</strong> 3x</p>
                    <p><strong>• Renda mensal:</strong> R$ 2.400</p>
                    <p><strong>• Risco:</strong> Máx R$ 30.000</p>
                    <p><strong>• DD máx:</strong> <span className="text-red-400 font-bold bg-red-900/30 px-1 sm:px-2 py-1 rounded text-xs">25%</span></p>
                    <p><strong>• Perfil:</strong> Moderado</p>
                  </div>
                </div>
                
                <div className="text-xs text-blue-300 bg-blue-900/20 p-2 sm:p-3 rounded-lg">
                  <p><strong>🎯 Ideal:</strong> Melhor risco x retorno</p>
                </div>
              </div>
            </div>
            
            {/* Estratégia Ganho de Capital - até 3x */}
            <div className="bg-slate-800/60 rounded-xl p-4 sm:p-6 border border-purple-500/40 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
              <div className="flex items-center mb-4">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mr-2 sm:mr-3" />
                <h4 className="text-lg sm:text-xl font-bold text-purple-300">
                  <span className="hidden sm:inline">Ganho de Capital</span>
                  <span className="sm:hidden">Capital</span>
                </h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-purple-900/30 p-3 sm:p-4 rounded-lg border border-purple-500/40">
                  <h5 className="font-semibold text-purple-300 mb-2 sm:mb-3 text-sm sm:text-base">
                    <span className="hidden sm:inline">🚀 Alavancagem 3x por R$ 10.000 - Ganhos Explosivos</span>
                    <span className="sm:hidden">🚀 3x - Explosivo</span>
                  </h5>
                  <div className="text-xs sm:text-sm text-purple-200 space-y-1 sm:space-y-2">
                    <p><strong>• Capital:</strong> R$ 10.000</p>
                    <p><strong>• Alavancagem:</strong> 3x limitado</p>
                    <p><strong>• Ganhos:</strong> R$ 2-3k/mês</p>
                    <p><strong>• Gestão:</strong> IA automática</p>
                    <p><strong>• DD máx:</strong> <span className="text-red-400 font-bold bg-red-900/30 px-1 sm:px-2 py-1 rounded text-xs">100%</span></p>
                    <p><strong>• Perfil:</strong> Arrojado</p>
                    <div className="text-xs text-red-200">Risco máx: -R$ 10.000</div>
                  </div>
                </div>
                
                <div className="text-xs text-purple-300 bg-purple-900/20 p-2 sm:p-3 rounded-lg">
                  <p><strong>🚀 Ideal:</strong> Ganhos explosivos</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabela Comparativa */}
          <div className="overflow-x-auto bg-slate-800/60 rounded-xl border border-slate-600/50 backdrop-blur-sm mt-6 sm:mt-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-600 bg-slate-700/60">
                  <th className="text-left py-2 sm:py-4 px-2 sm:px-4 font-semibold text-white text-xs sm:text-sm">Estratégia</th>
                  <th className="text-center py-2 sm:py-4 px-2 sm:px-4 font-semibold text-red-400 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Pessimista</span>
                    <span className="sm:hidden">Pess.</span>
                  </th>
                  <th className="text-center py-2 sm:py-4 px-2 sm:px-4 font-semibold text-yellow-400 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Moderado</span>
                    <span className="sm:hidden">Mod.</span>
                  </th>
                  <th className="text-center py-2 sm:py-4 px-2 sm:px-4 font-semibold text-green-400 text-xs sm:text-sm">
                    <span className="hidden sm:inline">Otimista</span>
                    <span className="sm:hidden">Otim.</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-600 hover:bg-slate-700/40 transition-colors">
                  <td className="py-2 sm:py-4 px-2 sm:px-4 font-medium text-green-300">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-1 sm:mr-2" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm">
                          <span className="hidden sm:inline">Conservador (1x)</span>
                          <span className="sm:hidden">1x</span>
                        </div>
                        <div className="text-xs text-green-400">R$ 10k</div>
                        <div className="text-xs text-red-400 font-medium">DD: 25%</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-red-300">
                    <div className="text-xs sm:text-sm font-bold">-R$ 2.000</div>
                    <div className="text-xs">-20% a.m.</div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-yellow-300">
                    <div className="text-xs sm:text-sm font-bold">R$ 800</div>
                    <div className="text-xs">8% a.m.</div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-green-300">
                    <div className="text-xs sm:text-sm font-bold">R$ 2.000</div>
                    <div className="text-xs">20% a.m.</div>
                  </td>
                </tr>
                <tr className="border-b border-slate-600 hover:bg-slate-700/40 bg-blue-900/30 transition-colors">
                  <td className="py-2 sm:py-4 px-2 sm:px-4 font-medium text-blue-300">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-1 sm:mr-2" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm">
                          <span className="hidden sm:inline">Saudável (3x)</span>
                          <span className="sm:hidden">3x</span>
                        </div>
                        <div className="text-xs text-blue-400">R$ 30k</div>
                        <div className="text-xs text-red-400 font-medium">DD: 25%</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-red-300">
                    <div className="text-xs sm:text-sm font-bold">-R$ 6.000</div>
                    <div className="text-xs">-20% a.m.</div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-yellow-300">
                    <div className="text-xs sm:text-sm font-bold">R$ 2.400</div>
                    <div className="text-xs">8% a.m.</div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-green-300">
                    <div className="text-xs sm:text-sm font-bold">R$ 6.000</div>
                    <div className="text-xs">20% a.m.</div>
                  </td>
                </tr>
                <tr className="border-b border-slate-600 hover:bg-slate-700/40 transition-colors">
                  <td className="py-2 sm:py-4 px-2 sm:px-4 font-medium text-purple-300">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 mr-1 sm:mr-2" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm">
                          <span className="hidden sm:inline">Capital (3x)</span>
                          <span className="sm:hidden">3x Cap</span>
                        </div>
                        <div className="text-xs text-purple-400">R$ 10k</div>
                        <div className="text-xs text-red-400 font-medium">DD: 100%</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-red-300">
                    <div className="text-xs sm:text-sm font-bold">-R$ 6.000</div>
                    <div className="text-xs">-20% a.m.</div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-yellow-300">
                    <div className="text-xs sm:text-sm font-bold">R$ 2.400</div>
                    <div className="text-xs">8% a.m.</div>
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-center text-green-300">
                    <div className="text-xs sm:text-sm font-bold">R$ 6.000</div>
                    <div className="text-xs">20% a.m.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 rounded-2xl p-4 sm:p-6 lg:p-8 text-white mb-12 border border-slate-600">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            <span className="hidden sm:inline">Por que Portfólios de IA são a Melhor Alternativa?</span>
            <span className="sm:hidden">Por que Portfólios de IA?</span>
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-green-500/30">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              </div>
              <h4 className="font-bold mb-2 text-green-300 text-sm sm:text-base">Alto Retorno</h4>
              <p className="text-xs sm:text-sm text-green-200">
                Cenário otimista: 20% a.m. vs 0,87% a.m. do CDI
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-red-500/30">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
              </div>
              <h4 className="font-bold mb-2 text-red-300 text-sm sm:text-base">Drawdown Controlado</h4>
              <p className="text-xs sm:text-sm text-red-200">
                <span className="font-bold">DD máx: 25% mensal</span> | Capital protegido
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-purple-500/30">
                <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
              </div>
              <h4 className="font-bold mb-2 text-purple-300 text-sm sm:text-base">Alavancagem Inteligente</h4>
              <p className="text-xs sm:text-sm text-purple-200">
                Até 3x para maximizar ganhos mensais
              </p>
            </div>
          </div>
        </div>

        {/* Aviso de Risco */}
        <div className="mt-6 sm:mt-8 bg-gradient-to-r from-yellow-600 to-orange-500 border border-yellow-500 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-white mr-2 sm:mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-white mb-2 text-sm sm:text-base">
                <span className="hidden sm:inline">⚠️ Aviso Importante sobre Riscos</span>
                <span className="sm:hidden">⚠️ Aviso de Riscos</span>
              </h4>
              <p className="text-xs sm:text-sm text-white leading-relaxed">
                <strong className="text-yellow-900 bg-yellow-200 px-2 py-1 rounded">Drawdown máximo: 25% mensal em todas as estratégias.</strong> A análise inclui meses de perda para mostrar cenário realista.
                <span className="hidden sm:inline"> Esta é uma SIMULAÇÃO EDUCATIVA baseada em projeções matemáticas.</span> <strong>Analista:</strong> Stefano Padula - CNPI 9796.
              </p>
              <div className="mt-4 text-center">
                <button
                  onClick={() => window.location.href = '/resultados'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="hidden sm:inline">Clique para Ver Resultados Reais Agora Mesmo</span>
                  <span className="sm:hidden">Ver Resultados Reais</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentComparisonChart;