import React, { useState } from 'react';
import Layout from '../components/Layout';
import ResultsCalendar from '../components/ResultsCalendar';

const ResultadosPage: React.FC = () => {
  const [riskSettings, setRiskSettings] = useState({
    dailyLossLimit: 5,
    monthlyLossLimit: 15,
    stopLossPercentage: 2,
    isActive: true
  });

  return (
    <Layout>
      <ResultsCalendar />
    </Layout>
  );
};

export default ResultadosPage;