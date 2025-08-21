import React from 'react';
import { useState } from 'react';
import Layout from '../components/Layout';
import Hero from '../components/Hero';
import QuantBrokerSection from '../components/QuantBrokerSection';
import WhatIsAIPortfolio from '../components/WhatIsAIPortfolio';
import LocationContent from '../components/LocationContent';
import PricingPlans from '../components/PricingPlans';
import InvestmentComparison from '../components/InvestmentComparison';
import BenefitsSection from '../components/BenefitsSection';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';

const HomePage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');

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
      <Hero onViewPlans={() => window.location.href = '/planos'} />
      <QuantBrokerSection />
      <WhatIsAIPortfolio />
      <LocationContent />
      <div id="pricing-section">
        <PricingPlans 
          onSelectPlan={handleSelectPlan} 
          billingPeriod={billingPeriod}
          onToggleBilling={setBillingPeriod}
          recommendedPlan={null}
        />
      </div>
      <InvestmentComparison />
      <Testimonials />
      <FAQ />
    </Layout>
  );
};

export default HomePage;