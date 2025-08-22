import React, { useState, useEffect } from 'react';
import { Check, Star, BarChart3, MessageCircle, Settings, Shield, TrendingUp, ExternalLink, Gift, Crown, Zap, Calculator, FileText, Building2, Award, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import WaitlistModal from './WaitlistModal';

interface PricingPlansProps {
  onSelectPlan: (planId: string) => void;
  billingPeriod: 'monthly' | 'semiannual' | 'annual';
  onToggleBilling: (period: 'monthly' | 'semiannual' | 'annual') => void;
  recommendedPlan: string | null;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ 
  onSelectPlan, 
  billingPeriod, 
  onToggleBilling, 
  recommendedPlan 
}) => {
  const [portfolioOffers, setPortfolioOffers] = useState<Record<string, any>>({});
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [updatingAvailability, setUpdatingAvailability] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const [hiddenOffers, setHiddenOffers] = useState<Set<string>>(new Set());
  const [showAdminControls, setShowAdminControls] = useState(false);

  useEffect(() => {
    fetchPortfolioOffers();
    
    // Load hidden offers from localStorage
    const saved = localStorage.getItem('hiddenOffers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHiddenOffers(new Set(parsed));
      } catch (error) {
        console.error('Error parsing hidden offers:', error);
      }
    }
  }, []);

  const fetchPortfolioOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_offers')
        .select('*');

      if (error) throw error;

      const offersMap = (data || []).reduce((acc, offer) => {
        acc[offer.portfolio_type] = offer;
        return acc;
      }, {});

      setPortfolioOffers(offersMap);
    } catch (error) {
      console.error('Error fetching portfolio offers:', error);
    }
  };

  const handlePlanClick = (planId: string) => {
    const offer = portfolioOffers[planId];
    if (offer && !offer.is_available) {
      setSelectedPortfolio(planId);
      setShowWaitlistModal(true);
    } else {
      onSelectPlan(planId);
    }
  };

  const getButtonText = (planId: string) => {
    const offer = portfolioOffers[planId];
    if (offer) {
      return offer.button_text;
    }
    return planId === 'bitcoin' ? 'Entrar na Fila de Espera' : 
           billingPeriod === 'monthly' ? 'Contratar Agora' : 'Falar com Suporte';
  };

  const isAvailable = (planId: string) => {
    const offer = portfolioOffers[planId];
    return offer ? offer.is_available : planId !== 'bitcoin';
  };

  const updateAvailability = async (planId: string, isCurrentlyAvailable: boolean) => {
    try {
      setUpdatingAvailability(planId);
      const { error } = await supabase
        .from('portfolio_offers')
        .upsert({
          portfolio_type: planId,
          is_available: !isCurrentlyAvailable,
          stripe_link: portfolioOffers[planId]?.stripe_link || '',
          button_text: !isCurrentlyAvailable ? 'Contratar Agora' : 'Entrar na Fila de Espera'
        }, {
          onConflict: 'portfolio_type'
        });

      if (error) throw error;
      await fetchPortfolioOffers();
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdatingAvailability(null);
    }
  };

  const toggleOfferVisibility = (planId: string) => {
    const newHidden = new Set(hiddenOffers);
    if (newHidden.has(planId)) {
      newHidden.delete(planId);
    } else {
      newHidden.add(planId);
    }
    setHiddenOffers(newHidden);
    localStorage.setItem('hiddenOffers', JSON.stringify(Array.from(newHidden)));
  };

  const getPortfolioDisplayName = (planId: string) => {
    const names = {
      'bitcoin': 'Portfólio Bitcoin',
      'mini-indice': 'Portfólio Mini Índice', 
      'mini-dolar': 'Portfólio Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return names[planId as keyof typeof names] || planId;
  };

  const plans = [
    {
      id: 'bitcoin',
      name: 'Portfólio Bitcoin',
      description: 'Operações com Bitcoin Futuro na B3 via Mosaico BTG',
      price: billingPeriod === 'annual' ? 'R$ 2.160,00' : billingPeriod === 'semiannual' ? 'R$ 1.440,00' : 'R$ 300,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 3.600,00' : billingPeriod === 'semiannual' ? 'R$ 1.800,00' : undefined,
      minCapital: 'R$ 3.000',
      dailyRisk: 'R$ 400 a R$ 600',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com baixo spread',
        'Portfólio inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy Bitcoin',
        'Plano semestral apenas no PIX',
        'Desconto em IR para Trading e Swing Trading',
        'DARFs automatizadas GRÁTIS',
        'Acesso à Plataforma Quant (2000 tokens)',
        'Pack de Robôs GRÁTIS'
      ],
      isAvailable: isAvailable('bitcoin')
    },
    {
      id: 'mini-indice',
      name: 'Portfólio Mini Índice',
      description: 'Ideal para operar com risco controlado e consistência',
      price: billingPeriod === 'annual' ? 'R$ 2.880,00' : billingPeriod === 'semiannual' ? 'R$ 1.920,00' : 'R$ 400,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 4.800,00' : billingPeriod === 'semiannual' ? 'R$ 2.400,00' : undefined,
      minCapital: 'R$ 5.000',
      dailyRisk: 'R$ 400 a R$ 600',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com baixo spread',
        'Portfólio inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy Mini Índice',
        'Plano semestral apenas no PIX',
        'Desconto em IR para Trading e Swing Trading',
        'DARFs automatizadas GRÁTIS',
        'Acesso à Plataforma Quant (2000 tokens)',
        'Pack de Robôs GRÁTIS'
      ],
      isRecommended: true,
      isAvailable: isAvailable('mini-indice')
    },
    {
      id: 'mini-dolar',
      name: 'Portfólio Mini Dólar',
      description: 'Projetado para aproveitar movimentos explosivos do dólar',
      price: billingPeriod === 'annual' ? 'R$ 3.960,00' : billingPeriod === 'semiannual' ? 'R$ 2.640,00' : 'R$ 550,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 6.600,00' : billingPeriod === 'semiannual' ? 'R$ 3.300,00' : undefined,
      minCapital: 'R$ 10.000',
      dailyRisk: 'R$ 400 a R$ 600',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com baixo spread',
        'Portfólio inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy Mini Dólar',
        'Plano semestral apenas no PIX',
        'Desconto em IR para Trading e Swing Trading',
        'DARFs automatizadas GRÁTIS',
        'Acesso à Plataforma Quant (2000 tokens)',
        'Pack de Robôs GRÁTIS'
      ],
      isAvailable: isAvailable('mini-dolar')
    },
    {
      id: 'portfolio-completo',
      name: 'Portfólio Completo',
      description: 'Acesso a todas as estratégias com gestão diversificada + Bitcoin BÔNUS',
      price: billingPeriod === 'annual' ? 'R$ 5.400,00' : billingPeriod === 'semiannual' ? 'R$ 3.600,00' : 'R$ 750,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 9.000,00' : billingPeriod === 'semiannual' ? 'R$ 4.500,00' : undefined,
      minCapital: 'R$ 15.000',
      dailyRisk: 'R$ 400 a R$ 800',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com baixo spread',
        'Portfólio inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy de todas as estratégias + Bitcoin BÔNUS',
        'Plano semestral apenas no PIX',
        'Desconto em IR para Trading e Swing Trading',
        'DARFs automatizadas GRÁTIS',
        'Acesso à Plataforma Quant (2000 tokens)',
        'Pack de Robôs GRÁTIS'
      ],
      isRecommended: true,
      isAvailable: isAvailable('portfolio-completo')
    }
  ];

  const visiblePlans = plans.filter(plan => !hiddenOffers.has(plan.id));

  const getGridCols = () => {
    const count = visiblePlans.length;
    if (count === 1) return 'grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Planos de Portfólios de IA - Quant Broker
          </h2>
          
          {isAdmin && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setShowAdminControls(!showAdminControls)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showAdminControls 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showAdminControls ? <Shield className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                {showAdminControls ? 'Ocultar Controles Admin' : 'Mostrar Controles Admin'}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-8">
            <button
              onClick={() => onToggleBilling('monthly')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                billingPeriod === 'monthly' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Plano Mensal
            </button>
            <button
              onClick={() => onToggleBilling('semiannual')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors relative text-sm sm:text-base ${
                billingPeriod === 'semiannual' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="hidden sm:inline">Plano Semestral (PIX)</span>
              <span className="sm:hidden">Semestral (PIX)</span>
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                20% OFF
              </span>
            </button>
            <button
              onClick={() => onToggleBilling('annual')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors relative text-sm sm:text-base ${
                billingPeriod === 'annual' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="hidden sm:inline">Plano Anual (PIX)</span>
              <span className="sm:hidden">Anual (PIX)</span>
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                40% OFF
              </span>
            </button>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm sm:text-lg text-gray-700 font-medium px-4">
              💳 <span className="text-blue-600">Planos Semestrais e Anuais:</span> Pagamento apenas no PIX
            </p>
          </div>
        </div>

        <div className={`grid ${getGridCols()} gap-6 lg:gap-8`}>
          {visiblePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border-2 transition-all hover:shadow-xl ${
                plan.isRecommended || plan.id === recommendedPlan
                  ? 'border-blue-500 transform scale-105'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {isAdmin && showAdminControls && (
                <div className="absolute -top-3 -right-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 min-w-[120px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">Admin</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-600">Ocultar</span>
                    <button
                      onClick={() => toggleOfferVisibility(plan.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                        hiddenOffers.has(plan.id) ? 'bg-gray-400' : 'bg-red-600'
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        hiddenOffers.has(plan.id) ? 'translate-x-1' : 'translate-x-5'
                      }`} />
                    </button>
                    <span className="text-xs text-gray-600">Mostrar</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Fila</span>
                    <button
                      onClick={() => updateAvailability(plan.id, isAvailable(plan.id))}
                      disabled={updatingAvailability === plan.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isAvailable(plan.id) ? 'bg-green-600' : 'bg-gray-400'
                      } ${updatingAvailability === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAvailable(plan.id) ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <span className="text-xs text-gray-600">Venda</span>
                  </div>
                  
                  <div className="text-center mt-2">
                    <span className={`text-xs font-medium ${
                      hiddenOffers.has(plan.id) ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {hiddenOffers.has(plan.id) ? 'Oferta Oculta' : 'Oferta Visível'}
                    </span>
                  </div>
                </div>
              )}

              {(plan.isRecommended || plan.id === recommendedPlan) && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {plan.id === recommendedPlan ? 'RECOMENDADO PARA VOCÊ' : 'RECOMENDADO'}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {plan.leverage}
                  </span>
                  <span className="text-xs text-gray-500">{plan.riskControl}</span>
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-xs sm:text-sm text-gray-500">A partir de</span>
                  {plan.originalPrice && (
                    <div className="text-sm sm:text-lg text-gray-400 line-through">{plan.originalPrice}</div>
                  )}
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">{plan.price}</div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {billingPeriod === 'annual' ? 'Plano anual' : billingPeriod === 'semiannual' ? 'Plano semestral' : 'Plano mensal'} | Capital mínimo: {plan.minCapital}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Risco diário: {plan.dailyRisk}</div>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan.id)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  plan.isRecommended || plan.id === recommendedPlan
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {getButtonText(plan.id)}
              </button>

              <button
                onClick={() => { window.location.href = '/resultados'; }}
                className="w-full mt-2 py-2 px-4 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all flex items-center justify-center text-sm sm:text-base"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Resultados Detalhados
              </button>

              {(billingPeriod === 'semiannual' || billingPeriod === 'annual') && plan.isAvailable && (
                {(() => {
                  // Determine the correct Asaas link based on plan and billing period
                  const getAsaasLink = (planId: string, period: string) => {
                    if (period === 'semiannual') {
                      switch (planId) {
                        case 'mini-indice': return 'https://www.asaas.com/c/gqvtfal7d61hceox';
                        case 'mini-dolar': return 'https://www.asaas.com/c/7vjo2ztulu31a1bf';
                        case 'portfolio-completo': return 'https://www.asaas.com/c/5kbvy19u5ptvagos';
                        default: return null;
                      }
                    } else if (period === 'annual') {
                      switch (planId) {
                        case 'mini-indice': return 'https://www.asaas.com/c/k4y1y8nyrszplydc';
                        case 'mini-dolar': return 'https://www.asaas.com/c/7jczq71q2b3jl86n';
                        case 'portfolio-completo': return 'https://www.asaas.com/c/18tvrzgpgeswrkqc';
                        default: return null;
                      }
                    }
                    return null;
                  };
                  
                  const asaasLink = getAsaasLink(plan.id, billingPeriod);
                  
                  return (
                    <button
                      onClick={() => {
                        if (asaasLink) {
                          window.open(asaasLink, '_blank');
                        } else {
                          window.open('https://wa.me/5511975333355?text=Olá%2C%20tenho%20interesse%20no%20' + encodeURIComponent(plan.name) + '%20no%20plano%20' + encodeURIComponent(billingPeriod === 'semiannual' ? 'semestral' : 'anual') + '.%20Pode%20me%20ajudar%20com%20o%20pagamento%20via%20PIX%3F', '_blank');
                        }
                      }}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center text-sm sm:text-base"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {asaasLink ? 'Pagar com Asaas' : 'Falar com Suporte'}
                    </button>
                  );
                })()}
              )}
            </div>
          ))}
        </div>

        {/* Seção de Custos Operacionais */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <Building2 className="h-6 w-6 mr-3 text-blue-600" />
              Custos Operacionais Separados
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Além da mensalidade do Portfólio de IA, existem custos operacionais cobrados separadamente pelo BTG Pactual e B3
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Custo de Plataforma */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-blue-900 mb-2">Custo de Plataforma</h4>
                <div className="text-3xl font-bold text-blue-600 mb-2">R$ 100,00</div>
                <div className="text-sm text-blue-700 mb-4">por mês (pago separadamente)</div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Tecnologia de copy trade de ponta via MetaTrader 5 no Mosaico BTG
                </p>
              </div>
            </div>

            {/* Emolumentos B3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-green-900 mb-2">Emolumentos B3</h4>
                <div className="text-lg font-bold text-green-600 mb-2">Conforme Operação</div>
                <div className="text-sm text-green-700 mb-4">taxas da bolsa</div>
                <p className="text-sm text-green-800 leading-relaxed mb-4">
                  Taxas oficiais da B3 aplicadas conforme regulamentação
                </p>
                <a
                  href="https://b3.com.br/tarifas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Conhecer Tarifas B3
                </a>
              </div>
            </div>

            {/* Corretagem Zerada */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-purple-900 mb-2">Corretagem Zerada</h4>
                <div className="text-3xl font-bold text-purple-600 mb-2">R$ 0,00</div>
                <div className="text-sm text-purple-700 mb-4">por operação</div>
                <p className="text-sm text-purple-800 leading-relaxed">
                  BTG Pactual oferece corretagem zero para todas as operações de trading
                </p>
              </div>
            </div>
          </div>

          {/* Resumo dos Custos */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <div className="text-center">
              <h4 className="text-lg font-bold text-yellow-900 mb-3">
                💡 Resumo dos Custos Totais
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-semibold text-yellow-900 mb-2">Custos Fixos Mensais</h5>
                  <ul className="text-yellow-800 space-y-1 text-left">
                    <li>• Mensalidade Portfólio de IA: R$ 300 a R$ 750</li>
                    <li>• Custo Plataforma BTG: R$ 100,00</li>
                    <li>• <strong>Total Fixo:</strong> R$ 400 a R$ 850/mês</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <h5 className="font-semibold text-yellow-900 mb-2">Custos Variáveis</h5>
                  <ul className="text-yellow-800 space-y-1 text-left">
                    <li>• Emolumentos B3: Conforme operação</li>
                    <li>• Corretagem BTG: R$ 0,00 (zerada)</li>
                    <li>• <strong>Vantagem:</strong> Sem surpresas na corretagem</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparativo Completo de Benefícios */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Comparativo Completo de Benefícios
          </h3>
          
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">Benefício</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-600">Mensal</th>
                  <th className="text-center py-4 px-4 font-semibold text-green-600">Semestral</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-600">Anual</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">DARFs Automatizadas</td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-orange-600 font-semibold">Pago</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-bold">🎁 GRÁTIS</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-bold">🎁 GRÁTIS</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">Pack de Robôs</td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-semibold">FREE</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-bold">🎁 Master</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-bold">🎁 Master</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">Assessoria Trader BTG</td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-semibold">FREE</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-bold">🎁 FREE</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-green-600 font-bold">🎁 FREE</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">Tokens Plataforma Quant</td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-purple-600 font-semibold">500/mês</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-purple-600 font-semibold">2000/mês</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-purple-600 font-semibold">2000/mês</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <WaitlistModal
          isOpen={showWaitlistModal}
          onClose={() => setShowWaitlistModal(false)}
          portfolioType={selectedPortfolio}
        />
      </div>
    </div>
  );
};

export default PricingPlans;