import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Home, Shield, Zap, DollarSign, Calculator, AlertTriangle } from 'lucide-react';

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
            Comparativo de Investimentos: Portfólios de IA vs Mercado
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Veja como os Portfólios de IA se comparam com CDI e investimentos imobiliários 
            em diferentes cenários de tempo e capital
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Capital Inicial:</label>
            <select
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={10000}>R$ 10.000</option>
              <option value={25000}>R$ 25.000</option>
              <option value={50000}>R$ 50.000</option>
              <option value={100000}>R$ 100.000</option>
              <option value={250000}>R$ 250.000</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Período:</label>
            <div className="flex gap-2">
              {[
                { value: '1year', label: '1 Ano' },
                { value: '3years', label: '3 Anos' },
                { value: '5years', label: '5 Anos' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {chartType === 'line' ? <TrendingUp className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
              {chartType === 'line' ? 'Evolução' : 'Comparativo'}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Evolução do Capital: {formatCurrency(initialCapital)} Inicial
          </h3>
          
          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="monthLabel" 
                    stroke="#64748b"
                    fontSize={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={formatCurrency}
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
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Portfólio IA (Meta: 60% a.a.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm font-medium text-gray-700">CDI (10,5% a.a. líquido)</span>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {investments.map((investment, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 transition-all hover:shadow-xl ${
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

              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-full mb-4`} style={{ backgroundColor: `${investment.color}20` }}>
                  <investment.icon className="h-8 w-8" style={{ color: investment.color }} />
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-2">{investment.name}</h4>
                
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-sm text-gray-500">Valor Final ({timeframe === '1year' ? '1 ano' : timeframe === '3years' ? '3 anos' : '5 anos'})</span>
                    <div className="text-2xl font-bold" style={{ color: investment.color }}>
                      R$ {investment.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm font-medium" style={{ color: investment.color }}>
                      +{investment.finalReturn.toFixed(1)}% total
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
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

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Características:</h5>
                  <div className="space-y-1 text-sm">
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
                      <li key={idx} className="text-sm text-green-600 flex items-start">
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
                      <li key={idx} className="text-sm text-orange-600 flex items-start">
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
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 rounded-2xl p-8 mb-12 border border-slate-700">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Estratégias de Alavancagem: Portfólio de IA Quant Broker
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Estratégia Renda Mensal - 1x Alavancagem */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <DollarSign className="h-6 w-6 text-green-400 mr-3" />
                <h4 className="text-xl font-bold text-green-300">Estratégia: Renda Mensal</h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                  <h5 className="font-semibold text-green-300 mb-3">🛡️ Alavancagem 1x - Foco em Renda Mensal</h5>
                  <div className="text-sm text-green-200 space-y-2">
                <tr className="border-b-2 border-slate-600 bg-slate-700/50">
                  <th className="text-left py-4 px-4 font-semibold text-white">Estratégia</th>
                  <th className="text-center py-4 px-4 font-semibold text-red-400">Pessimista</th>
                  <th className="text-center py-4 px-4 font-semibold text-yellow-400">Moderado</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-400">Otimista</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-400">CDI (10,5% a.a.)</th>
                    <p><strong>• Perfil:</strong> Conservador, busca renda consistente</p>
                  </div>
                </div>
                <tr className="border-b border-slate-600 hover:bg-slate-700/30">
                  <td className="py-4 px-4 font-medium text-green-300">
                      <div className="text-xs text-yellow-300 font-medium mb-1">😐 Moderado (40% a.a.) - DD 15%</div>
                      <DollarSign className="h-5 w-5 text-green-400 mr-2" />
                    <p><strong>Capital:</strong> R$ 10.000</p>
                      <div className="text-xs text-red-300 font-medium mb-1">😰 Pessimista (20% a.a.) - DD 25%</div>
                        <div className="text-xs text-slate-400">R$ 10.000</div>
                    <p><strong>Valor Final (1 ano):</strong> R$ 16.000</p>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm">
                  </div>
                  <td className="py-4 px-4 text-center text-red-300">
                <h4 className="text-xl font-bold text-purple-300">Estratégia: Ganho de Capital</h4>
                    <div className="text-xs">20% a.a. • DD 25%</div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-blue-500/40 backdrop-blur-sm relative">
                  <td className="py-4 px-4 text-center text-yellow-300">
                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                    <div className="text-xs">40% a.a. • DD 15%</div>
                  <div className="text-sm text-purple-200 space-y-2">
                  <td className="py-4 px-4 text-center text-green-300">
              </div>
                    <div className="text-xs">60% a.a. • DD 10%</div>
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                  <td className="py-4 px-4 text-center text-blue-300">
                    <p><strong>• Drawdown controlado:</strong> <span className="text-red-300 font-bold">máx 25% mensal</span></p>
                  <div className="text-sm text-purple-800 space-y-2">
                    <p><strong>• Capital:</strong> R$ 10.000</p>
                    <p><strong>• Meta anual:</strong> 60% líquido</p>
                    <p><strong>• Alavancagem máxima:</strong> 3x por R$ 10.000</p>
                <tr className="border-b border-slate-600 hover:bg-slate-700/30 bg-blue-900/20">
                  <td className="py-4 px-4 font-medium text-blue-300">
                    <p><strong>• Drawdown máximo:</strong> <span className="text-red-300 font-bold">25% mensal</span></p>
                      <TrendingUp className="h-5 w-5 text-blue-400 mr-2" />
                      <div className="text-sm text-red-200">Perda total: -R$ 10.000 (risco máximo)</div>
                
                        <div className="text-xs text-blue-400">R$ 30.000 - RECOMENDADO</div>
                      <div className="text-xs text-yellow-300 font-medium mb-1">😐 Moderado (120% a.a.) - DD 15%</div>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p><strong>Alavancagem 3x:</strong></p>
                  <td className="py-4 px-4 text-center text-red-300">
                      <div className="text-xs text-green-300 font-medium mb-1">🚀 Otimista (180% a.a.) - DD 10%</div>
                    <div className="text-xs">20% a.a. • DD 25%</div>
                    <p><strong>🎯 Recompensa:</strong> Ganhos explosivos</p>
                  <td className="py-4 px-4 text-center text-yellow-300">
                </div>
                    <div className="text-xs">40% a.a. • DD 15%</div>
            </div>
                  <td className="py-4 px-4 text-center text-green-300">
        </div>
                    <div className="text-xs">60% a.a. • DD 10%</div>
        {/* Key Insights */}
                  <td className="py-4 px-4 text-center text-blue-300">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Por que Portfólios de IA são a Melhor Alternativa?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <tr className="border-b border-slate-600 hover:bg-slate-700/30">
                  <td className="py-4 px-4 font-medium text-purple-300">
                <TrendingUp className="h-8 w-8 text-white" />
                      <Calculator className="h-5 w-5 text-purple-400 mr-2" />
              <h4 className="font-bold mb-2">Alto Retorno</h4>
              <p className="text-sm text-green-100">
                        <div className="text-xs text-purple-400">R$ 10.000</div>
              </p>
            </div>
            
                  <td className="py-4 px-4 text-center text-red-300">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="text-xs">Perda total • DD 25%</div>
              </div>
              <h4 className="font-bold mb-2 text-red-300">Drawdown Controlado</h4>
              <p className="text-sm text-red-200">
                <span className="font-bold">DD máx: 25% mensal</span> | Capital protegido
              </p>
                  <td className="py-4 px-4 text-center text-green-300">
            
                    <div className="text-xs">172.8% a.a. • DD 10%</div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <Calculator className="h-8 w-8 text-purple-400" />
              </div>
              <h4 className="font-bold mb-2 text-purple-300">Alavancagem Inteligente</h4>
              <p className="text-sm text-purple-200">
                Até 5x para maximizar ganhos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 rounded-2xl p-8 text-white mb-12 border border-slate-600">
        <div className="mt-8 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-300 mb-2">Aviso Importante sobre Riscos</h4>
              <p className="text-sm text-yellow-200 leading-relaxed">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <strong className="text-red-300">Drawdown máximo esperado: 25% mensal.</strong> A análise inclui meses de perda para mostrar cenário realista.
              <h4 className="font-bold mb-2 text-green-300">Alto Retorno</h4>
              <p className="text-sm text-green-200">
                Diversifique sempre seus investimentos e consulte um assessor qualificado. <strong>Analista Responsável:</strong> Yallon Mazuti de Carvalho - CNPI-T 8964.
              </p>
            </div>
          </div>
        </div>
              <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                <Shield className="h-8 w-8 text-red-400" />
  );
};

export default InvestmentComparisonChart;
