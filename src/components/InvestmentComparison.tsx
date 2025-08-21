import React from 'react';
import { Home, Shield, TrendingUp, Star } from 'lucide-react';

const InvestmentComparison: React.FC = () => {
  const investments = [
    {
      type: 'Investimento em Imóvel',
      icon: Home,
      initialInvestment: 'R$ 400.000',
      monthlyReturn: 'R$ 2.000',
      returnRate: '(0,5% a.m.)',
      pros: ['Ativo físico', 'Valorização histórica'],
      cons: ['Baixa liquidez', 'Custos de manutenção', 'Impostos (IPTU, IR)', 'Risco de vacância'],
      color: 'gray',
      image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop'
    },
    {
      type: 'Renda Fixa (CDB/Tesouro)',
      icon: Shield,
      initialInvestment: 'R$ 200.000',
      monthlyReturn: 'R$ 2.000',
      returnRate: '(1% a.m.)',
      pros: ['Segurança (FGC/Governo)', 'Previsibilidade'],
      cons: ['Liquidez média/baixa', 'Rendimento limitado', 'Imposto de Renda'],
      color: 'blue',
      image: 'https://i.postimg.cc/1RgH8QT7/Bm-JH-Zqk-JMvz-Fxm-bot-Kt.png'
    },
    {
      type: 'Portfólio de IA',
      icon: TrendingUp,
      initialInvestment: 'R$ 10.000',
      monthlyReturn: 'R$ 2.000',
      returnRate: '(potencial 20% a.m.)',
      pros: ['Alta liquidez', 'Alto poder de escalabilidade', 'Gestão profissional', 'Diversificação automática'],
      cons: ['Risco limitado ao capital investido', 'Volatilidade de mercado'],
      color: 'green',
      isRecommended: true,
      image: 'https://i.postimg.cc/4xRXhX3J/mao-futurista-trabalhar-num-portatil.jpg'
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Comparativo: Portfólios de IA vs Outros Investimentos
          </h2>
          <h3 className="text-xl text-gray-600 max-w-3xl mx-auto">
            Veja como os Portfólios de IA se comparam com outras modalidades de investimento
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {investments.map((investment, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 transition-all hover:shadow-xl ${
                investment.isRecommended 
                  ? 'border-green-500 transform scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img 
                src={investment.image}
                alt={investment.type}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              {investment.isRecommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    RECOMENDADO
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex p-4 rounded-full mb-4 ${
                  investment.color === 'green' ? 'bg-green-100' :
                  investment.color === 'blue' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <investment.icon className={`h-8 w-8 ${
                    investment.color === 'green' ? 'text-green-600' :
                    investment.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-4">{investment.type}</h4>
                
                <div className="space-y-2 mb-6">
                  <div>
                    <span className="text-sm text-gray-500">Investimento Inicial</span>
                    <div className="text-2xl font-bold text-gray-900">{investment.initialInvestment}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Rendimento Mensal</span>
                    <div className={`text-xl font-bold ${
                      investment.color === 'green' ? 'text-green-600' :
                      investment.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {investment.monthlyReturn}
                    </div>
                    <div className="text-sm text-gray-500">{investment.returnRate}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Vantagens:</h4>
                  <ul className="space-y-1">
                    {investment.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-green-600 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-red-700 mb-2">Considerações:</h5>
                  <ul className="space-y-1">
                    {investment.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default InvestmentComparison;