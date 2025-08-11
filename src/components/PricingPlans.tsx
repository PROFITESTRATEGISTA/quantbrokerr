import React from 'react';
import { useState, useEffect } from 'react';
import { Check, Star, TrendingUp, Shield, Building2, Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import WaitlistModal from './WaitlistModal';
import { useAuth } from '../hooks/useAuth';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  minCapital: string;
  dailyRisk: string;
  features: string[];
  isRecommended?: boolean;
  isAvailable: boolean;
  leverage: string;
  riskControl: string;
}

interface PricingPlansProps {
  onSelectPlan: (planId: string) => void;
  billingPeriod: 'monthly' | 'semiannual' | 'annual';
  onToggleBilling: (period: 'monthly' | 'semiannual' | 'annual') => void;
  recommendedPlan?: string | null;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan, billingPeriod, onToggleBilling, recommendedPlan }) => {
  const [portfolioOffers, setPortfolioOffers] = useState<Record<string, any>>({});
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchPortfolioOffers();
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

  const handlePlanSelection = (planId: string) => {
    const offer = portfolioOffers[planId];
    
    if (offer && !offer.is_available) {
      // Abrir modal de fila de espera
      setSelectedPortfolio(planId);
      setShowWaitlistModal(true);
    } else {
      // Usar função original
      onSelectPlan(planId);
    }
  };

  const getButtonText = (planId: string) => {
    const offer = portfolioOffers[planId];
    if (offer) {
      return offer.button_text;
    }
    
    // Fallback para valores padrão
    if (planId === 'bitcoin') {
      return 'Entrar na Fila de Espera';
    }
    return billingPeriod === 'monthly' ? 'Contratar Agora' : 'Falar com Suporte';
  };

  const isPlanAvailable = (planId: string) => {
    const offer = portfolioOffers[planId];
    return offer ? offer.is_available : planId !== 'bitcoin'; // Bitcoin padrão como indisponível
  };

  const toggleAvailability = async (planId: string, currentAvailability: boolean) => {
    try {
      setUpdating(planId);
      
      const { error } = await supabase
        .from('portfolio_offers')
        .upsert({
          portfolio_type: planId,
          is_available: !currentAvailability,
          stripe_link: portfolioOffers[planId]?.stripe_link || '',
          button_text: !currentAvailability ? 'Contratar Agora' : 'Entrar na Fila de Espera'
        }, {
          onConflict: 'portfolio_type'
        });

      if (error) throw error;
      
      await fetchPortfolioOffers();
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdating(null);
    }
  };

  const plans: Plan[] = [
    {
      id: 'bitcoin',
      name: 'Portfólio Bitcoin',
      description: 'Operações com Bitcoin Futuro na B3 via Mosaico BTG — vagas limitadas',
      price: billingPeriod === 'annual' ? 'R$ 2.160,00' : billingPeriod === 'semiannual' ? 'R$ 1.440,00' : 'R$ 300,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 3.600,00' : billingPeriod === 'semiannual' ? 'R$ 1.800,00' : undefined,
      minCapital: 'R$ 3.000',
      dailyRisk: 'R$ 100 a R$ 200',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com execução sem spread',
        'Setup de tendência com inteligência artificial',
        'Operações via MetaTrader 5',
        'Compatível com contas Mosaico BTG',
        'Sem necessidade de configurar parâmetros'
      ],
      isAvailable: isPlanAvailable('bitcoin')
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
        'Robô inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy Mini Índice',
        'Plano semestral no Pix ou em até 12x'
      ],
      isRecommended: true,
      isAvailable: isPlanAvailable('mini-indice')
    },
    {
      id: 'mini-dolar',
      name: 'Portfólio Mini Dólar',
      description: 'Projetado para aproveitar movimentos explosivos do dólar',
      price: billingPeriod === 'annual' ? 'R$ 3.960,00' : billingPeriod === 'semiannual' ? 'R$ 2.640,00' : 'R$ 550,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 6.600,00' : billingPeriod === 'semiannual' ? 'R$ 3.300,00' : undefined,
      minCapital: 'R$ 10.000',
      dailyRisk: 'R$ 600',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com baixo spread',
        'Robô inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy Mini Dólar',
        'Plano semestral no Pix ou em até 12x'
      ],
      isAvailable: isPlanAvailable('mini-dolar')
    },
    {
      id: 'portfolio-completo',
      name: 'Portfólio Completo',
      description: 'Acesso a todas as estratégias com gestão diversificada',
      price: billingPeriod === 'annual' ? 'R$ 5.400,00' : billingPeriod === 'semiannual' ? 'R$ 3.600,00' : 'R$ 750,00',
      originalPrice: billingPeriod === 'annual' ? 'R$ 9.000,00' : billingPeriod === 'semiannual' ? 'R$ 4.500,00' : undefined,
      minCapital: 'R$ 15.000',
      dailyRisk: 'R$ 400 a R$ 800',
      leverage: 'Até 1x',
      riskControl: 'IA no Controle de Risco',
      features: [
        'Copy premium com baixo spread',
        'Robô inteligente com saídas e stops dinâmicos',
        'Operações via MetaTrader 5',
        'Copy de todas as estratégias',
        'Plano semestral no Pix ou em até 12x'
      ],
      isRecommended: true,
      isAvailable: isPlanAvailable('portfolio-completo')
    }
  ];

  return (
    <>
      <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Planos de Portfólios de IA - Quant Broker
          </h2>
          
          {/* Admin Controls Toggle */}
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
                {showAdminControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showAdminControls ? 'Ocultar Controles Admin' : 'Mostrar Controles Admin'}
              </button>
            </div>
          )}
          
          <div className="flex justify-center space-x-8 mb-8">
          <div className="flex justify-center space-x-8 mb-8">
            <button 
              onClick={() => onToggleBilling('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                billingPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Plano Mensal
            </button>
            <button 
              onClick={() => onToggleBilling('semiannual')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors relative ${
                billingPeriod === 'semiannual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Plano Semestral (PIX ou 12x)
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                20% OFF
              </span>
            </button>
            <button 
              onClick={() => onToggleBilling('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors relative ${
                billingPeriod === 'annual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Plano Anual (PIX ou 12x)
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                40% OFF
              </span>
            </button>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 font-medium">
              💳 <span className="text-blue-600">Planos Semestrais e Anuais:</span> Pagamento no PIX ou em até 12x no cartão
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 border-2 transition-all hover:shadow-xl ${
                plan.isRecommended || plan.id === recommendedPlan
                  ? 'border-blue-500 transform scale-105' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Admin Switch - Only visible when admin controls are shown */}
              {isAdmin && showAdminControls && (
                <div className="absolute -top-3 -right-3 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">Admin</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Fila</span>
                    <button
                      onClick={() => toggleAvailability(plan.id, isPlanAvailable(plan.id))}
                      disabled={updating === plan.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isPlanAvailable(plan.id) ? 'bg-green-600' : 'bg-gray-400'
                      } ${updating === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isPlanAvailable(plan.id) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-600">Venda</span>
                  </div>
                  
                  <div className="text-center mt-2">
                    <span className={`text-xs font-medium ${
                      isPlanAvailable(plan.id) ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {updating === plan.id ? 'Atualizando...' : (
                        isPlanAvailable(plan.id) ? 'Disponível' : 'Fila de Espera'
                      )}
                    </span>
                  </div>
                </div>
              )}

              {(plan.isRecommended || plan.id === recommendedPlan) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {plan.id === recommendedPlan ? 'RECOMENDADO PARA VOCÊ' : 'RECOMENDADO'}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {plan.leverage}
                  </span>
                  <span className="text-xs text-gray-500">{plan.riskControl}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-sm text-gray-500">A partir de</span>
                  {plan.originalPrice && (
                    <div className="text-lg text-gray-400 line-through">{plan.originalPrice}</div>
                  )}
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  <div className="text-sm text-gray-500">
                    {billingPeriod === 'annual' ? 'Plano anual' : billingPeriod === 'semiannual' ? 'Plano semestral' : 'Plano mensal'} | Capital mínimo: {plan.minCapital}
                  </div>
                  <div className="text-sm text-gray-600">Risco diário: {plan.dailyRisk}</div>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={!plan.isAvailable}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  plan.isRecommended || plan.id === recommendedPlan
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                } ${!plan.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {getButtonText(plan.id)}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Apenas 50 vagas disponíveis - Para planos semestrais e anuais, entre em contato com nossa equipe
          </p>
        </div>
      </div>
      </div>

      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        portfolioType={selectedPortfolio}
      />
    </>
  );
};

export default PricingPlans;