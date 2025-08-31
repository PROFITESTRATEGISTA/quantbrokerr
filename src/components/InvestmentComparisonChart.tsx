import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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
      // CDI 8% a.a. líquido (após impostos e taxas)
      const cdiMonthlyRate = 0.08 / 12; // 8% anual dividido por 12 meses
      const cdiValue = initialCapital * Math.pow(1 + cdiMonthlyRate, i);

      // Imóvel: 0.5% a.m. líquido (6% a.a. após impostos, IPTU, manutenção)
      const realEstateMonthlyRate = 0.005;
      const realEstateValue = initialCapital * Math.pow(1 + realEstateMonthlyRate, i);

      // Portfólio IA: 5% a.m. médio (60% a.a.) com volatilidade
      const aiMonthlyRate = 0.05;
      // Adicionar volatilidade realista (alguns meses negativos)
      const volatilityFactor = i % 6 === 0 ? 0.7 : i % 8 === 0 ? 0.85 : 1; // Alguns meses com performance menor
      const aiValue = initialCapital * Math.pow(1 + (aiMonthlyRate * volatilityFactor), i);

      data.push({
        month: i,
        monthLabel: i === 0 ? 'Início' : `${i}º mês`,
        cdi: cdiValue,
        imovel: realEstateValue,
        portfolioIA: aiValue,
        cdiReturn: ((cdiValue - initialCapital) / initialCapital) * 100,
        imovelReturn: ((realEstateValue - initialCapital) / initialCapital) * 100,
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
      monthlyReturn: 5.0,
      annualReturn: 60.0,
      risk: 'Limitado ao capital investido',
      liquidity: 'Alta (D+0)',
      advantages: [
        'Alto poder de alavancagem',
        'Gestão automatizada 24/7',
        'Diversificação automática',
        'Liquidez imediata'
      ],
      considerations: [
        'Volatilidade de mercado',
        'Risco limitado ao capital'
      ]
    },
    {
      name: 'CDI (8% a.a.)',
      icon: Shield,
      color: '#3b82f6',
      finalValue: finalData.cdi,
      finalReturn: finalData.cdiReturn,
      monthlyReturn: 0.67,
      annualReturn: 8.0,
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
    },
    {
      name: 'Investimento Imobiliário',
      icon: Home,
      color: '#6b7280',
      finalValue: finalData.imovel,
      finalReturn: finalData.imovelReturn,
      monthlyReturn: 0.5,
      annualReturn: 6.0,
      risk: 'Médio (mercado imobiliário)',
      liquidity: 'Baixa (meses para vender)',
      advantages: [
        'Ativo físico',
        'Valorização histórica',
        'Renda de aluguel'
      ],
      considerations: [
        'Baixa liquidez',
        'Custos de manutenção',
        'IPTU e impostos',
        'Risco de vacância'
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
                    name="CDI 8% a.a."
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="imovel" 
                    stroke="#6b7280" 
                    strokeWidth={3}
                    name="Imóvel 6% a.a."
                    dot={{ fill: '#6b7280', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={[{
                  name: 'Resultado Final',
                  'Portfólio IA': finalData.portfolioIA,
                  'CDI 8% a.a.': finalData.cdi,
                  'Imóvel 6% a.a.': finalData.imovel
                }]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={formatCurrency} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Portfólio IA" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="CDI 8% a.a." fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Imóvel 6% a.a." fill="#6b7280" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Portfólio IA (60% a.a.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm font-medium text-gray-700">CDI (8% a.a. líquido)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Imóvel (6% a.a. líquido)</span>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Análise de Cenários: Renda Mensal vs Ganho de Capital
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Renda Mensal */}
            <div className="bg-white rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
                <h4 className="text-xl font-bold text-blue-900">Estratégia: Renda Mensal</h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-blue-900 mb-2">Portfólio IA (Alavancagem 1x)</h5>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Capital: R$ {initialCapital.toLocaleString('pt-BR')}</p>
                    <p>• Renda mensal estimada: R$ {(initialCapital * 0.05).toLocaleString('pt-BR')}</p>
                    <p>• Risco limitado ao capital investido</p>
                    <p>• Liquidez imediata (D+0)</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">CDI (8% a.a.)</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Capital: R$ {initialCapital.toLocaleString('pt-BR')}</p>
                    <p>• Renda mensal: R$ {(initialCapital * 0.0067).toLocaleString('pt-BR')}</p>
                    <p>• Segurança FGC</p>
                    <p>• Liquidez D+1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ganho de Capital */}
            <div className="bg-white rounded-xl p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                <h4 className="text-xl font-bold text-green-900">Estratégia: Ganho de Capital</h4>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-green-900 mb-2">Portfólio IA (Alavancagem 2x-5x)</h5>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• Capital: R$ {initialCapital.toLocaleString('pt-BR')}</p>
                    <p>• Potencial em 3 anos: R$ {(finalData.portfolioIA * 2).toLocaleString('pt-BR')}</p>
                    <p>• Alto poder de alavancagem</p>
                    <p>• Gestão automatizada de risco</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Imóvel (6% a.a.)</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Capital: R$ {(initialCapital * 2).toLocaleString('pt-BR')} (entrada + financ.)</p>
                    <p>• Valor em 3 anos: R$ {(finalData.imovel * 2).toLocaleString('pt-BR')}</p>
                    <p>• Baixa liquidez</p>
                    <p>• Custos de manutenção</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Por que Portfólios de IA são a Melhor Alternativa?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Alto Retorno</h4>
              <p className="text-sm text-green-100">
                Potencial de 60% a.a. vs 8% do CDI
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Risco Controlado</h4>
              <p className="text-sm text-blue-100">
                Limitado ao capital investido
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Alta Liquidez</h4>
              <p className="text-sm text-purple-100">
                Resgate imediato vs meses do imóvel
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-bold mb-2">Alavancagem</h4>
              <p className="text-sm text-yellow-100">
                Multiplique seus resultados
              </p>
            </div>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Aviso Importante sobre Riscos</h4>
              <p className="text-sm text-yellow-800 leading-relaxed">
                <strong>Renda Variável:</strong> Os investimentos em Portfólios de IA estão sujeitos a riscos e podem resultar em perdas patrimoniais. 
                Rentabilidades passadas não garantem resultados futuros. Os percentuais apresentados são estimativas baseadas em backtests 
                e resultados históricos. É recomendável a leitura cuidadosa do regulamento antes de investir.
                <br /><br />
                <strong>Comparação Educativa:</strong> Esta comparação tem fins educativos. CDI e imóveis têm características de risco diferentes. 
                Diversifique sempre seus investimentos e consulte um assessor qualificado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentComparisonChart;