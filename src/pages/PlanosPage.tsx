import React, { useState } from 'react';
import Layout from '../components/Layout';
import PricingPlans from '../components/PricingPlans';
import InvestmentComparison from '../components/InvestmentComparison';
import InvestmentComparisonChart from '../components/InvestmentComparisonChart';
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
        'mini-indice': 'https://www.asaas.com/c/xbfb1ehxgyt90ort',
        'mini-dolar': 'https://www.asaas.com/c/nkwungjievdsugf8',
        'portfolio-completo': 'https://www.asaas.com/c/nzm53d1loayb64l4'
      };
      
      const link = stripeLinks[planId as keyof typeof stripeLinks];
      if (link) {
        window.open(link, '_blank');
      }
    }
  };

  return (
    <Layout>
      <div className="text-center py-16 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Escolha seu <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Portfólio de IA Quant Broker</span>
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
      <InvestmentComparisonChart />
      <BenefitsSection />
    </Layout>
  );
};

export default PlanosPage;