import React, { useState } from 'react';
import Layout from '../components/Layout';
import ResultsCalendar from '../components/ResultsCalendar';
import FinancialPanel from '../components/FinancialPanel';
import WaitlistPanel from '../components/WaitlistPanel';
import UserManagementPanel from '../components/UserManagementPanel';
import { BarChart3, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'results' | 'financial' | 'users' | 'waitlist'>('results');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'results':
        return <ResultsCalendar />;
      case 'financial':
        return <FinancialPanel />;
      case 'users':
        return <UserManagementPanel />;
      case 'waitlist':
        return <WaitlistPanel />;
      default:
        return <ResultsCalendar />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="mt-2 text-gray-600">Gerencie resultados, finanças e estatísticas</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex space-x-1 p-1">
              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'results'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Resultados
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'financial'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Financeiro
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Central de Usuários
              </button>
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'waitlist'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Fila de Espera
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;