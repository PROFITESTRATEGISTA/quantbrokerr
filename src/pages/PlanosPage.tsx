import React, { useState } from 'react';
import Layout from '../components/Layout';
import PricingPlans from '../components/PricingPlans';
import InvestmentComparison from '../components/InvestmentComparison';
import BenefitsSection from '../components/BenefitsSection';

const PlanosPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    if (planId === 'bitcoin') {
      // Redirect to login or tutorial
      window.location.href = '/dashboard';
    } else {
      // Direct to Stripe checkout for other plans
      const stripeLinks = {
        'mini-indice': 'https://buy.stripe.com/cN217HePO833c6IcNo',
        'mini-dolar': 'https://buy.stripe.com/8wM03DgXW3MNc6I3cf',
        'portfolio-completo': 'https://buy.stripe.com/7sY5kD4Hravx7XYfeK9R60O'
      };
      
      const link = stripeLinks[planId as keyof typeof stripeLinks];
      if (link) {
        window.open(link, '_blank');
      }
    }
  };

  return (
    <Layout>
      <div className="pt-20">
        <div className="text-center py-16 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Escolha seu <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Portfólio de IA</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Encontre o plano ideal para seu perfil de investimento e capital disponível
          </p>
        </div>
        
        <PricingPlans 
          onSelectPlan={handleSelectPlan} 
          billingPeriod={billingPeriod}
          onToggleBilling={setBillingPeriod}
          recommendedPlan={recommendedPlan}
        />
        <InvestmentComparison />
        <BenefitsSection />
      </div>
    </Layout>
  );
};

export default PlanosPage;