import React from 'react';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';

const DashboardPage: React.FC = () => {
  return (
    <Layout>
      <div className="pt-20">
        <Dashboard onNavigateToTutorial={() => window.location.href = '/tutorial'} />
      </div>
    </Layout>
  );
};

export default DashboardPage;