import React from 'react';
import Layout from '../components/Layout';
import ResultsCalendar from '../components/ResultsCalendar';

const ResultadosPage: React.FC = () => {
  return (
    <Layout>
      <div className="pt-20">
        <ResultsCalendar />
      </div>
    </Layout>
  );
};

export default ResultadosPage;